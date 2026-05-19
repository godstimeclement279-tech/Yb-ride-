import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// ─── notifyOnBookingStatusChange ────────────────────────────────────────────
//
// Fires whenever /bookings/{id} updates. When the status crosses a
// transition that the passenger or driver should hear about, we push an
// FCM notification to their device(s) via fcmTokens stored on the user doc.
//
// Token storage convention (set when the apps register for push):
//   /users/{id}.fcmTokens:   string[]   (passenger devices)
//   /drivers/{id}.fcmTokens: string[]   (driver devices)
//
// Sound / channel routing:
//   - Driver "new assignment" alerts get the urgent channel + loud sound so
//     drivers wake up to incoming offers even when their phone is muted.
//   - All other transitions use the default channel + default sound.

interface Booking {
  status?: string;
  passengerId?: string;
  driverId?: string;
  fare?: { total?: number; carTypeName?: string };
  dropoff?: { label?: string };
}

async function tokensFor(collection: string, id?: string): Promise<string[]> {
  if (!id) return [];
  const snap = await getFirestore().doc(`${collection}/${id}`).get();
  const raw = snap.exists ? (snap.data()?.fcmTokens as unknown) : undefined;
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string' && t.length > 0);
}

interface NotificationPlan {
  title: string;
  body: string;
  // 'urgent' channel for driver alerts that must cut through DND.
  channel: 'default' | 'urgent';
  audience: 'passenger' | 'driver' | 'both';
}

function planForTransition(
  prev: string,
  next: string,
): { driver?: NotificationPlan; passenger?: NotificationPlan } | null {
  if (prev === 'paid' && next === 'assigned') {
    return {
      driver: {
        title: 'New trip — please respond',
        body: 'A passenger needs you. Tap to accept or decline within 30 seconds.',
        channel: 'urgent',
        audience: 'driver',
      },
      passenger: {
        title: 'Driver assigned',
        body: 'A driver has accepted your trip. Live tracking is now on.',
        channel: 'default',
        audience: 'passenger',
      },
    };
  }
  if (prev === 'assigned' && next === 'driver_arrived') {
    return {
      passenger: {
        title: 'Your driver has arrived',
        body: 'Look for your driver at the pickup point.',
        channel: 'default',
        audience: 'passenger',
      },
    };
  }
  if (prev === 'driver_arrived' && next === 'in_progress') {
    return {
      passenger: {
        title: 'Trip started',
        body: 'Enjoy your ride.',
        channel: 'default',
        audience: 'passenger',
      },
    };
  }
  if (next === 'completed') {
    return {
      passenger: {
        title: 'Trip completed',
        body: 'Thanks for riding with YB Ride. Tap to rate your driver.',
        channel: 'default',
        audience: 'passenger',
      },
    };
  }
  if (next === 'cancelled') {
    return {
      driver: {
        title: 'Trip cancelled',
        body: 'This trip has been cancelled.',
        channel: 'default',
        audience: 'driver',
      },
      passenger: {
        title: 'Trip cancelled',
        body: 'Your trip was cancelled. You can book another any time.',
        channel: 'default',
        audience: 'passenger',
      },
    };
  }
  return null;
}

async function sendToTokens(
  tokens: string[],
  plan: NotificationPlan,
  bookingId: string,
  status: string,
): Promise<{ ok: number; fail: number }> {
  if (tokens.length === 0) return { ok: 0, fail: 0 };
  const isUrgent = plan.channel === 'urgent';
  const message: MulticastMessage = {
    tokens,
    notification: { title: plan.title, body: plan.body },
    data: { bookingId, status },
    android: {
      priority: isUrgent ? 'high' : 'normal',
      notification: {
        channelId: plan.channel,
        sound: 'default',
        defaultVibrateTimings: !isUrgent,
        vibrateTimingsMillis: isUrgent ? [0, 800, 400, 800, 400, 800] : undefined,
        priority: isUrgent ? 'max' : 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          // iOS time-sensitive interruption matches the spirit of an urgent
          // alert without requiring the Critical Alert entitlement (which
          // needs an Apple Developer support request to enable).
          'interruption-level': isUrgent ? 'time-sensitive' : 'active',
        },
      },
    },
  };
  try {
    const result = await getMessaging().sendEachForMulticast(message);
    return { ok: result.successCount, fail: result.failureCount };
  } catch (err) {
    logger.error('sendToTokens failed', err);
    return { ok: 0, fail: tokens.length };
  }
}

export const notifyOnBookingStatusChange = onDocumentUpdated(
  {
    region: 'europe-west1',
    document: 'bookings/{bookingId}',
  },
  async (event) => {
    const before = event.data?.before.data() as Booking | undefined;
    const after = event.data?.after.data() as Booking | undefined;
    if (!before || !after) return;
    if (before.status === after.status) return;

    const plan = planForTransition(before.status ?? '', after.status ?? '');
    if (!plan) return;

    const bookingId = event.params.bookingId;
    const status = after.status ?? '';

    // Driver leg.
    if (plan.driver) {
      const tokens = await tokensFor('drivers', after.driverId);
      const r = await sendToTokens(tokens, plan.driver, bookingId, status);
      logger.info('notifyOnBookingStatusChange driver', {
        bookingId,
        transition: `${before.status}->${after.status}`,
        ...r,
      });
    }

    // Passenger leg.
    if (plan.passenger) {
      const tokens = await tokensFor('users', after.passengerId);
      const r = await sendToTokens(tokens, plan.passenger, bookingId, status);
      logger.info('notifyOnBookingStatusChange passenger', {
        bookingId,
        transition: `${before.status}->${after.status}`,
        ...r,
      });
    }
  },
);
