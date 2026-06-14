import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { COLLECTIONS, type Staff, type StaffPermission } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export function subscribeStaff(
  callback: (staff: Staff[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.STAFF),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Staff),
      );
      callback(rows);
    },
    (err) => console.warn('subscribeStaff error', err),
  );
}

export async function setStaffActive(
  staffId: string,
  isActive: boolean,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.STAFF, staffId), {
    isActive,
    updatedAt: Date.now(),
  });
}

export async function updateStaffPermissions(
  staffId: string,
  permissions: StaffPermission[],
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  await updateDoc(doc(db, COLLECTIONS.STAFF, staffId), {
    permissions,
    updatedAt: Date.now(),
  });
}
