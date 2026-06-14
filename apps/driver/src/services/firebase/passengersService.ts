import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, type Passenger } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

// Driver app reads passenger profiles to show the assigned rider's name +
// phone during a trip. Passengers live in /users (role='passenger').
export function subscribePassenger(
  passengerId: string,
  callback: (passenger: Passenger | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const db = getDb()!;
  return onSnapshot(
    doc(db, COLLECTIONS.USERS, passengerId),
    snap => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Passenger);
    },
    err => {
      if (__DEV__) console.warn('subscribePassenger error', err);
    },
  );
}
