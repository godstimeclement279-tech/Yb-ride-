import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type Booking, type BookingStatus } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

/** Subscribe to every booking created in the last `sinceMs` window, newest first. */
export function subscribeAllBookings(
  callback: (bookings: Booking[]) => void,
  sinceMs: number = 7 * 24 * 60 * 60 * 1000,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const since = Date.now() - sinceMs;
  const q = query(
    collection(getDb()!, COLLECTIONS.BOOKINGS),
    where('createdAt', '>=', since),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const bookings = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Booking),
      );
      callback(bookings);
    },
    (err) => import.meta.env.DEV && console.warn('subscribeAllBookings error', err),
  );
}

/** Subscribe to bookings in a specific status — handy for live "needs assignment" lanes. */
export function subscribeBookingsByStatus(
  status: BookingStatus,
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(getDb()!, COLLECTIONS.BOOKINGS),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
    },
    (err) => import.meta.env.DEV && console.warn('subscribeBookingsByStatus error', err),
  );
}

export function subscribeBooking(
  id: string,
  callback: (booking: Booking | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(getDb()!, COLLECTIONS.BOOKINGS, id),
    (snap) =>
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null),
    (err) => import.meta.env.DEV && console.warn('subscribeBooking error', err),
  );
}

/** Manual driver assignment — the staff app's headline action. */
export async function assignDriver(
  bookingId: string,
  driverId: string,
  staffUid: string,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const ref = doc(getDb()!, COLLECTIONS.BOOKINGS, bookingId);
  await updateDoc(ref, {
    driverId,
    staffAssignedBy: staffUid,
    status: 'assigned',
    assignedAt: Date.now(),
  });
}

export async function cancelBooking(
  bookingId: string,
  reason: string,
  staffUid: string,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const ref = doc(getDb()!, COLLECTIONS.BOOKINGS, bookingId);
  await updateDoc(ref, {
    status: 'cancelled',
    cancelledAt: Date.now(),
    cancelledBy: 'staff',
    cancellationReason: reason,
    staffAssignedBy: staffUid,
  });
}
