import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, type Passenger } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export function subscribePassenger(
  id: string,
  callback: (p: Passenger | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(getDb()!, COLLECTIONS.USERS, id),
    (snap) =>
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Passenger) : null),
    (err) => console.warn('subscribePassenger error', err),
  );
}
