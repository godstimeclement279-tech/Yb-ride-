import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type Booking } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export async function createBooking(
  data: Omit<Booking, 'id'>,
): Promise<{ id: string }> {
  if (!FIREBASE_CONFIGURED) {
    return { id: `local_${Date.now().toString(36)}` };
  }
  const ref = await addDoc(
    collection(getDb()!, COLLECTIONS.BOOKINGS),
    data as Record<string, unknown>,
  );
  return { id: ref.id };
}

export async function updateBooking(
  id: string,
  patch: Partial<Booking>,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  // Skip writes for locally-generated booking ids (fallback path).
  if (id.startsWith('local_')) return;
  const ref = doc(getDb()!, COLLECTIONS.BOOKINGS, id);
  await updateDoc(ref, patch as Record<string, unknown>);
}

export function subscribePassengerBookings(
  passengerId: string,
  callback: (bookings: Booking[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(getDb()!, COLLECTIONS.BOOKINGS),
    where('passengerId', '==', passengerId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    snap => {
      const bookings = snap.docs.map(
        d => ({ id: d.id, ...d.data() } as Booking),
      );
      callback(bookings);
    },
    err => {
      if (__DEV__) console.warn('subscribePassengerBookings error', err);
    },
  );
}

export function subscribeBooking(
  id: string,
  callback: (booking: Booking | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED || id.startsWith('local_')) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(getDb()!, COLLECTIONS.BOOKINGS, id),
    snap => callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null),
    err => {
      if (__DEV__) console.warn('subscribeBooking error', err);
    },
  );
}
