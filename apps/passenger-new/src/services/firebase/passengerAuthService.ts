import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User as FbUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
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
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    default:
      return 'Could not sign in. Try again.';
  }
}
