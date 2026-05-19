import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS, type Driver } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb, getFbAuth } from './index';

// ─── Driver authentication ─────────────────────────────────────────────────
//
// Drivers do NOT self-register. Admin creates the account via the admin
// dashboard's "Add driver" callable (createStaffAccount with role='driver'),
// which provisions the Firebase Auth user + writes the /drivers/{uid} doc.
// The driver app just signs in with the credentials admin hands them.

export async function signInDriver(email: string, password: string): Promise<string> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase is not configured.');
  const cred = await signInWithEmailAndPassword(
    getFbAuth()!,
    email.trim(),
    password,
  );
  return cred.user.uid;
}

export async function signOutDriver(): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  await fbSignOut(getFbAuth()!);
}

/**
 * Resolve /drivers/{uid}. Returns null if the doc is missing — that means
 * the Auth user exists but the admin hasn't yet provisioned the driver
 * record (or it was deleted). Caller should treat as "not authorized".
 */
export async function fetchDriverProfile(uid: string): Promise<Driver | null> {
  if (!FIREBASE_CONFIGURED) return null;
  const snap = await getDoc(doc(getDb()!, COLLECTIONS.DRIVERS, uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() } as Driver;
}

export function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is wrong.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact dispatch.';
    default:
      return 'Could not sign in. Try again.';
  }
}
