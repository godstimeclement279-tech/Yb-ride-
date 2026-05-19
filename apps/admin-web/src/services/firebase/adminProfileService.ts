import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { FIREBASE_CONFIGURED, getDb } from './index';

// ─── adminProfileService ───────────────────────────────────────────────────
//
// Fetch + subscribe to the operator's /users/{uid} doc and check the
// role='admin' gate. Mirrors the staff-web staffService pattern so the
// AuthContext shape is symmetrical across the two dashboards.

export interface AdminProfile {
  id: string;
  role: 'admin';
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

function parseProfile(id: string, data: Record<string, unknown>): AdminProfile | null {
  if (data.role !== 'admin') return null;
  return {
    id,
    role: 'admin',
    name: (data.name as string) ?? '',
    email: (data.email as string) ?? '',
    phone: data.phone as string | undefined,
    isActive: data.isActive !== false,
  };
}

export async function fetchAdminProfile(uid: string): Promise<AdminProfile | null> {
  if (!FIREBASE_CONFIGURED) return null;
  const snap = await getDoc(doc(getDb()!, 'users', uid));
  if (!snap.exists()) return null;
  return parseProfile(uid, snap.data());
}

export function subscribeAdminProfile(
  uid: string,
  callback: (profile: AdminProfile | null) => void,
): () => void {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(getDb()!, 'users', uid),
    (snap) => callback(snap.exists() ? parseProfile(uid, snap.data()) : null),
    (err) => {
      console.warn('subscribeAdminProfile error', err);
      callback(null);
    },
  );
}
