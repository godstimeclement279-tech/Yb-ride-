import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS, type Driver } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export function subscribeDrivers(
  callback: (drivers: Driver[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.DRIVERS),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const drivers = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Driver),
      );
      callback(drivers);
    },
    (err) => import.meta.env.DEV && console.warn('subscribeDrivers error', err),
  );
}

export async function setDriverActive(
  driverId: string,
  isActive: boolean,
  adminId: string,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  const patch: Record<string, unknown> = {
    isActive,
    updatedAt: Date.now(),
  };
  if (isActive) {
    patch.approvedAt = Date.now();
    patch.approvedBy = adminId;
    patch.status = 'offline';
  } else {
    patch.status = 'suspended';
  }
  await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), patch);
}
