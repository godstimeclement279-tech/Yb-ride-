import { doc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, type Driver } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

// Passenger app reads the assigned driver's profile during a trip to show
// name, vehicle, rating, and phone (for the call button).
export function subscribeDriver(
  driverId: string,
  callback: (driver: Driver | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const db = getDb()!;
  return onSnapshot(
    doc(db, COLLECTIONS.DRIVERS, driverId),
    snap => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as Driver);
    },
    err => {
      if (__DEV__) console.warn('subscribeDriver error', err);
    },
  );
}
