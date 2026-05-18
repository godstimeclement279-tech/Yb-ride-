import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS, type Zone } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

/**
 * Live subscription to every zone in the project, ordered by createdAt desc.
 * When Firebase isn't configured the callback is invoked once with an empty
 * array so the UI can still render its empty state.
 */
export function subscribeZones(
  callback: (zones: Zone[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.ZONES),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const zones = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Zone),
      );
      callback(zones);
    },
    (err) => console.warn('subscribeZones error', err),
  );
}

export async function createZone(
  zone: Omit<Zone, 'id'>,
): Promise<{ id: string }> {
  if (!FIREBASE_CONFIGURED) {
    return { id: `local-${Date.now()}` };
  }
  const db = getDb()!;
  const ref = await addDoc(collection(db, COLLECTIONS.ZONES), zone);
  return { id: ref.id };
}

export async function updateZone(
  zoneId: string,
  patch: Partial<Zone>,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.ZONES, zoneId), patch);
}

export async function deleteZone(zoneId: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await deleteDoc(doc(db, COLLECTIONS.ZONES, zoneId));
}
