import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { COLLECTIONS, type Staff } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

/**
 * Read the staff profile (role + permissions + isActive) for an auth UID.
 * Returns null if no matching staff doc exists. Used by AuthContext to gate
 * sign-in: a Firebase Auth user without a staff doc cannot enter the app.
 */
export async function fetchStaffProfile(uid: string): Promise<Staff | null> {
  if (!FIREBASE_CONFIGURED) return null;
  const snap = await getDoc(doc(getDb()!, COLLECTIONS.STAFF, uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Staff;
}

export function subscribeStaffProfile(
  uid: string,
  callback: (staff: Staff | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(getDb()!, COLLECTIONS.STAFF, uid),
    (snap) => {
      callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Staff) : null);
    },
    (err) => {
      console.warn('subscribeStaffProfile error', err);
    },
  );
}
