import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type Driver } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export function subscribeAllDrivers(
  callback: (drivers: Driver[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(getDb()!, COLLECTIONS.DRIVERS),
    orderBy('name', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver))),
    (err) => import.meta.env.DEV && console.warn('subscribeAllDrivers error', err),
  );
}

export function subscribeDriver(
  id: string,
  callback: (driver: Driver | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(getDb()!, COLLECTIONS.DRIVERS, id),
    (snap) =>
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Driver) : null),
    (err) => import.meta.env.DEV && console.warn('subscribeDriver error', err),
  );
}

/** Drivers who are eligible for assignment (active, not currently on a trip). */
export function subscribeAssignableDrivers(
  callback: (drivers: Driver[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(getDb()!, COLLECTIONS.DRIVERS),
    where('isActive', '==', true),
    where('status', 'in', ['online']),
  );
  return onSnapshot(
    q,
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver))),
    (err) => import.meta.env.DEV && console.warn('subscribeAssignableDrivers error', err),
  );
}
