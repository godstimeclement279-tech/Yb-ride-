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
// Token storage convention (set when the apps register for push in Wave 6):
//   /passengers/{id}.fcmTokens: string[]
//   /drivers/{id}.fcmTokens:    string[]
//
// Wave 6 will wire token registration into the passenger + driver apps. For
// now this function is harmless — if no tokens are present we just no-op.

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

interface NotificationSpec {
  title: string;
  body: string;
  audience: 'passenger' | 'driver' | 'both';
}

function specForTransition(prev: string, next: string): NotificationSpec | null {
  if (prev === 'paid' && next === 'assigned') {
    return {
      title: 'Driver assigned',
      body: 'A driver has been assigned to your trip. Tracking is live.',
      audience: 'both',
    };
  }
  if (prev === 'assigned' && next === 'driver_arrived') {
    return {
      title: 'Your driver has arrived',
      body: 'Look for your driver at the pickup point.',
      audience: 'passenger',
    };
  }
  if (prev === 'driver_arrived' && next === 'in_progress') {
    return {
      title: 'Trip started',
      body: 'Enjoy your ride.',
      audience: 'passenger',
    };
  }
  if (next === 'completed') {
    return {
      title: 'Trip completed',
      body: 'Thanks for riding with YB Ride. Tap to rate your driver.',
      audience: 'passenger',
    };
  }
  if (next === 'cancelled') {
    return {
      title: 'Trip cancelled',
      body: 'Your trip was cancelled. You can book another any time.',
      audience: 'both',
    };
  }
  return null;
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

    const spec = specForTransition(before.status ?? '', after.status ?? '');
    if (!spec) return;

    const targets: string[] = [];
    if (spec.audience === 'passenger' || spec.audience === 'both') {
      targets.push(...(await tokensFor('passengers', after.passengerId)));
    }
    if (spec.audience === 'driver' || spec.audience === 'both') {
      targets.push(...(await tokensFor('drivers', after.driverId)));
    }
    if (targets.length === 0) {
      logger.info('notifyOnBookingStatusChange: no tokens', {
        bookingId: event.params.bookingId,
        transition: `${before.status}->${after.status}`,
      });
      return;
    }

    const message: MulticastMessage = {
      tokens: targets,
      notification: { title: spec.title, body: spec.body },
      data: {
        bookingId: event.params.bookingId,
        status: after.status ?? '',
      },
    };

    try {
      const result = await getMessaging().sendEachForMulticast(message);
      logger.info('notifyOnBookingStatusChange sent', {
        success: result.successCount,
        failure: result.failureCount,
      });
    } catch (err) {
      logger.error('notifyOnBookingStatusChange send error', err);
    }
  },
);
