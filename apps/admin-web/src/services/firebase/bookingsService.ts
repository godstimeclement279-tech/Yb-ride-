import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { COLLECTIONS, type Booking } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export function subscribeBookings(
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.BOOKINGS),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Booking),
      );
      callback(rows);
    },
    (err) => console.warn('subscribeBookings error', err),
  );
}

export function subscribeBooking(
  bookingId: string,
  callback: (booking: Booking | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const db = getDb()!;
  return onSnapshot(
    doc(db, COLLECTIONS.BOOKINGS, bookingId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Booking);
    },
    (err) => console.warn('subscribeBooking error', err),
  );
}
