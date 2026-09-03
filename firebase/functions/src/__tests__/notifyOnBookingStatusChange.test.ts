import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FakeFirestore } from './helpers/http';

const { fake, messaging } = vi.hoisted(() => ({
  fake: { db: null as unknown },
  messaging: {
    sendEachForMulticast: vi.fn(),
  },
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => fake.db,
  FieldValue: { serverTimestamp: () => ({}), increment: () => ({}) },
}));
vi.mock('firebase-admin/messaging', () => ({
  getMessaging: () => ({ sendEachForMulticast: messaging.sendEachForMulticast }),
}));

import {
  notifyOnBookingStatusChange,
  planForTransition,
  sanitizeTokens,
  buildNotificationMessage,
  type NotificationPlan,
} from '../notifyOnBookingStatusChange';

// The v2 firestore trigger exposes the raw handler as `func.run`, which is
// the documented seam for unit tests. Event.data holds the Change object.
function statusEvent(before: unknown, after: unknown, bookingId = 'b1') {
  return {
    params: { bookingId },
    data: { before: { data: () => before }, after: { data: () => after } },
  };
}

function runTrigger(event: unknown): Promise<void> {
  return (notifyOnBookingStatusChange as unknown as { run: (e: unknown) => Promise<void> }).run(event);
}

const DRIVER_PLAN: NotificationPlan = {
  title: 'New trip — please respond',
  body: 'A passenger needs you.',
  channel: 'urgent',
  audience: 'driver',
};
const PASSENGER_PLAN: NotificationPlan = {
  title: 'Driver assigned',
  body: 'A driver has accepted your trip.',
  channel: 'default',
  audience: 'passenger',
};

describe('planForTransition', () => {
  it('notifies both driver (urgent) and passenger on paid -> assigned', () => {
    const plan = planForTransition('paid', 'assigned');
    expect(plan?.driver).toMatchObject({ channel: 'urgent', audience: 'driver' });
    expect(plan?.driver?.title).toContain('New trip');
    expect(plan?.passenger).toMatchObject({ channel: 'default', audience: 'passenger' });
  });

  it('notifies only the passenger on assigned -> driver_arrived and driver_arrived -> in_progress', () => {
    expect(planForTransition('assigned', 'driver_arrived')?.driver).toBeUndefined();
    expect(planForTransition('assigned', 'driver_arrived')?.passenger).toBeDefined();
    expect(planForTransition('driver_arrived', 'in_progress')?.passenger).toBeDefined();
  });

  it('notifies the passenger on completion and both parties on cancellation', () => {
    const completed = planForTransition('in_progress', 'completed');
    expect(completed?.passenger?.title).toBe('Trip completed');
    expect(completed?.driver).toBeUndefined();

    const cancelled = planForTransition('assigned', 'cancelled');
    expect(cancelled?.driver).toBeDefined();
    expect(cancelled?.passenger).toBeDefined();
  });

  it('returns null for transitions that need no notification', () => {
    expect(planForTransition('pending_payment', 'paid')).toBeNull();
    expect(planForTransition('paid', 'driver_arrived')).toBeNull();
    // Same-status transitions are filtered by the handler, not the planner.
    expect(planForTransition('paid', 'assigned')).not.toBeNull();
    expect(planForTransition('', '')).toBeNull();
  });
});

describe('sanitizeTokens', () => {
  it('returns only non-empty strings from an array', () => {
    expect(sanitizeTokens(['tok-1', '', 'tok-2', 42, null, undefined])).toEqual(['tok-1', 'tok-2']);
  });

  it('returns [] for anything that is not an array', () => {
    expect(sanitizeTokens(undefined)).toEqual([]);
    expect(sanitizeTokens('tok-1')).toEqual([]);
    expect(sanitizeTokens({ 0: 'tok-1' })).toEqual([]);
  });
});

describe('buildNotificationMessage', () => {
  it('builds an urgent Android/iOS payload for driver alerts', () => {
    const msg = buildNotificationMessage(['d-tok'], DRIVER_PLAN, 'b1', 'assigned');
    expect(msg.tokens).toEqual(['d-tok']);
    expect(msg.data).toEqual({ bookingId: 'b1', status: 'assigned' });
    expect(msg.notification).toEqual({ title: DRIVER_PLAN.title, body: DRIVER_PLAN.body });
    expect(msg.android).toMatchObject({
      priority: 'high',
      notification: {
        channelId: 'urgent',
        priority: 'max',
        defaultVibrateTimings: false,
        vibrateTimingsMillis: [0, 800, 400, 800, 400, 800],
      },
    });
    expect(msg.apns?.payload?.aps['interruption-level']).toBe('time-sensitive');
  });

  it('builds a default payload for non-urgent notifications', () => {
    const msg = buildNotificationMessage(['p-tok'], PASSENGER_PLAN, 'b1', 'assigned');
    expect(msg.android).toMatchObject({
      priority: 'normal',
      notification: { channelId: 'default', priority: 'default', defaultVibrateTimings: true },
    });
    expect(msg.android?.notification?.vibrateTimingsMillis).toBeUndefined();
    expect(msg.apns?.payload?.aps['interruption-level']).toBe('active');
  });
});

describe('notifyOnBookingStatusChange trigger', () => {
  beforeEach(() => {
    fake.db = new FakeFirestore();
    messaging.sendEachForMulticast.mockReset();
    messaging.sendEachForMulticast.mockResolvedValue({ successCount: 1, failureCount: 0 });
  });

  it('sends an urgent driver alert and a default passenger alert on paid -> assigned', async () => {
    (fake.db as FakeFirestore).seed('drivers/d1', { fcmTokens: ['d-tok'] });
    (fake.db as FakeFirestore).seed('users/p1', { fcmTokens: ['p-tok'] });
    const before = { status: 'paid', passengerId: 'p1', driverId: 'd1' };

    await runTrigger(
      statusEvent(before, { ...before, status: 'assigned' }),
    );

    expect(messaging.sendEachForMulticast).toHaveBeenCalledTimes(2);
    const [driverMsg, passengerMsg] = messaging.sendEachForMulticast.mock.calls.map((c) => c[0]);
    expect(driverMsg.tokens).toEqual(['d-tok']);
    expect(driverMsg.android?.notification?.channelId).toBe('urgent');
    expect(passengerMsg.tokens).toEqual(['p-tok']);
    expect(passengerMsg.android?.notification?.channelId).toBe('default');
  });

  it('skips a party that has no tokens or no id', async () => {
    (fake.db as FakeFirestore).seed('drivers/d1', {});
    (fake.db as FakeFirestore).seed('users/p1', { fcmTokens: ['p-tok'] });
    const before = { status: 'paid', passengerId: 'p1', driverId: 'd1' };

    await runTrigger(
      statusEvent(before, { ...before, status: 'assigned' }),
    );

    expect(messaging.sendEachForMulticast).toHaveBeenCalledTimes(1);
    expect(messaging.sendEachForMulticast.mock.calls[0]![0].tokens).toEqual(['p-tok']);
  });

  it('does nothing for transitions without a notification plan', async () => {
    await runTrigger(
      statusEvent({ status: 'pending_payment', passengerId: 'p1' }, { status: 'paid', passengerId: 'p1' }),
    );
    expect(messaging.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('does nothing when the status did not change', async () => {
    await runTrigger(
      statusEvent({ status: 'assigned' }, { status: 'assigned', note: 'x' }),
    );
    expect(messaging.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('sends to a passenger-only plan (driver_arrived) and tolerates FCM errors', async () => {
    (fake.db as FakeFirestore).seed('users/p1', { fcmTokens: ['p-tok'] });
    messaging.sendEachForMulticast.mockRejectedValueOnce(new Error('fcm down'));

    await expect(
      runTrigger(
        statusEvent(
          { status: 'assigned', passengerId: 'p1' },
          { status: 'driver_arrived', passengerId: 'p1' },
        ),
      ),
    ).resolves.toBeUndefined();
    expect(messaging.sendEachForMulticast).toHaveBeenCalledTimes(1);
  });
});
