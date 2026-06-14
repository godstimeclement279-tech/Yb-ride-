import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User as FbUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { Passenger } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb, getFbAuth } from './index';

// ─── Passenger authentication + profile ────────────────────────────────────
//
// Stage 8b: email + password via Firebase Auth, profile mirrored to
// /users/{uid} with role='passenger'. Phone OTP follows in 8e.

interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phone: string;
}

/**
 * Create an Auth user + a matching /users/{uid} doc. Returns the Passenger
 * profile so the caller can show the home screen without an extra round-trip.
 */
export async function signUpPassenger({
  email,
  password,
  name,
  phone,
}: SignUpInput): Promise<Passenger> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase is not configured.');
  const auth = getFbAuth()!;
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const profile: Passenger = {
    id: cred.user.uid,
    role: 'passenger',
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    isActive: true,
    totalTrips: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(getDb()!, 'users', cred.user.uid), {
    ...profile,
    serverCreatedAt: serverTimestamp(),
  });
  return profile;
}

export async function signInPassenger(
  email: string,
  password: string,
): Promise<FbUser> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase is not configured.');
  const cred = await signInWithEmailAndPassword(
    getFbAuth()!,
    email.trim(),
    password,
  );
  return cred.user;
}

export async function signOutPassenger(): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  await fbSignOut(getFbAuth()!);
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase is not configured.');
  await sendPasswordResetEmail(getFbAuth()!, email.trim());
}

// Patch the passenger profile. Updates /users/{uid} and the Auth displayName
// when name changes. Email + phone changes are allowed here but only update
// the Firestore doc — actually changing the Firebase Auth email/phone needs
// reauthentication, which we don't ship yet (post-launch).
export async function updatePassengerProfile(
  uid: string,
  patch: { name?: string; phone?: string; email?: string },
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const db = getDb()!;
  const update: Record<string, unknown> = {
    ...patch,
    updatedAt: Date.now(),
  };
  await updateDoc(doc(db, 'users', uid), update);
  const auth = getFbAuth();
  if (auth?.currentUser && patch.name) {
    await updateProfile(auth.currentUser, { displayName: patch.name }).catch(() => {});
  }
}

export async function deletePassengerAccountDoc(uid: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  // Soft delete: flip isActive=false so the user can still be restored by
  // admin if they appeal. Hard delete (removing the auth user) is admin-only
  // via the deleteAccount callable.
  await updateDoc(doc(getDb()!, 'users', uid), {
    isActive: false,
    updatedAt: Date.now(),
  });
  await fbSignOut(getFbAuth()!).catch(() => {});
}

/**
 * Resolve the /users/{uid} doc for an authenticated user. Returns null if
 * the doc is missing OR if the role isn't 'passenger' (e.g. an admin signing
 * in to the passenger app — we treat that as unauthorized).
 */
export async function fetchPassengerProfile(uid: string): Promise<Passenger | null> {
  if (!FIREBASE_CONFIGURED) return null;
  const snap = await getDoc(doc(getDb()!, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  if (data.role !== 'passenger') return null;
  return {
    id: uid,
    role: 'passenger',
    name: (data.name as string) ?? '',
    phone: (data.phone as string) ?? '',
    email: (data.email as string) ?? '',
    isActive: data.isActive !== false,
    totalTrips: (data.totalTrips as number) ?? 0,
    averageRating: data.averageRating as number | undefined,
    createdAt: (data.createdAt as number) ?? Date.now(),
    updatedAt: (data.updatedAt as number) ?? Date.now(),
  };
}

export function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is wrong.';
    case 'auth/email-already-in-use':
      return 'An account already exists for that email. Try signing in.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'app/timeout':
      return 'Could not reach the server (timed out). Your phone may be on Wi-Fi with no internet — switch to mobile data or a Wi-Fi with internet, then try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    default:
      return 'Could not sign in. Try again.';
  }
}
