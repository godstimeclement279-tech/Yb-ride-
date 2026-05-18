import {
  arrayUnion,
  collection,
  deleteField,
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

/**
 * Live subscription to the driver's currently assigned, in-flight booking
 * (assigned / driver_arrived / in_progress). Returns the most recent if
 * multiple exist (shouldn't, but defensive).
 */
export function subscribeActiveBooking(
  driverId: string,
  callback: (booking: Booking | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const db = getDb()!;
  const liveStatuses: BookingStatus[] = ['assigned', 'driver_arrived', 'in_progress'];
  const q = query(
    collection(db, COLLECTIONS.BOOKINGS),
    where('driverId', '==', driverId),
    where('status', 'in', liveStatuses),
  );
  return onSnapshot(
    q,
    snap => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const bookings = snap.docs.map(
        d => ({ id: d.id, ...d.data() } as Booking),
      );
      // Pick most recently created if Firestore returns more than one.
      bookings.sort((a, b) => b.createdAt - a.createdAt);
      callback(bookings[0] ?? null);
    },
    err => {
      if (__DEV__) console.warn('subscribeActiveBooking error', err);
    },
  );
}

/**
 * Driver's completed + cancelled history. Capped at 50 most recent.
 */
export function subscribeDriverHistory(
  driverId: string,
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.BOOKINGS),
    where('driverId', '==', driverId),
    where('status', 'in', ['completed', 'cancelled']),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    snap => {
      const bookings = snap.docs
        .slice(0, 50)
        .map(d => ({ id: d.id, ...d.data() } as Booking));
      callback(bookings);
    },
    err => {
      if (__DEV__) console.warn('subscribeDriverHistory error', err);
    },
  );
}

export async function updateBookingStatus(
  bookingId: string,
  patch: Partial<Booking>,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), patch);
}

/**
 * Driver accepted the staff-assigned offer. Booking remains in 'assigned'
 * status but acceptedAt is now set, so the UI moves from "Incoming trip"
 * to the active-trip flow.
 */
export async function acceptBooking(bookingId: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
    acceptedAt: Date.now(),
  });
}

/**
 * Driver declined the offer. Booking returns to the staff queue
 * (status='paid', driverId cleared, driver added to declinedDriverIds so
 * staff knows not to re-offer to the same driver).
 */
export async function declineBooking(
  bookingId: string,
  driverId: string,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.BOOKINGS, bookingId), {
    status: 'paid' as BookingStatus,
    driverId: deleteField(),
    staffAssignedBy: deleteField(),
    assignedAt: deleteField(),
    acceptedAt: deleteField(),
    declinedDriverIds: arrayUnion(driverId),
  });
}
