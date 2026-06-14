import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type Passenger } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

// Passengers live in /users where role='passenger'. There is no dedicated
// /passengers collection — the user doc is the canonical source.
export function subscribePassengers(
  callback: (passengers: Passenger[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('role', '==', 'passenger'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Passenger),
      );
      callback(rows);
    },
    (err) => console.warn('subscribePassengers error', err),
  );
}

export async function setPassengerActive(
  passengerId: string,
  isActive: boolean,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.USERS, passengerId), {
    isActive,
    updatedAt: Date.now(),
  });
}
