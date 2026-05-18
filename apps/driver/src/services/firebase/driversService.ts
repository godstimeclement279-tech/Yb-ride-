import {
  doc,
  onSnapshot,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { COLLECTIONS, type Driver } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

/**
 * Look up a driver by phone. Returned in legacy MVP login flow (no auth).
 * Returns null if Firestore unavailable, no match, or driver inactive.
 */
export async function findDriverByPhone(phone: string): Promise<Driver | null> {
  if (!FIREBASE_CONFIGURED) return null;
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.DRIVERS),
    where('phone', '==', phone.trim()),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0]!;
  return { id: d.id, ...d.data() } as Driver;
}

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

/**
 * Update online/offline status. Server timestamp captures last toggle for
 * staff dashboard. Status string mirrors DriverStatus enum.
 */
export async function setDriverStatus(
  driverId: string,
  status: 'online' | 'offline' | 'on_trip',
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.DRIVERS, driverId), {
    status,
    lastStatusChangeAt: serverTimestamp(),
  });
}
