// Sign in with Apple — bridges expo-apple-authentication (which returns an
// Apple identity token + optional name) to Firebase Auth (which accepts that
// token as an OAuthCredential and creates/links the Firebase user).
//
// iOS-only. Caller should hide the button on Android (or any platform where
// `isAppleAuthAvailable()` returns false) so we don't surface a broken flow.
//
// Lazy require of expo-apple-authentication so the JS bundle still loads on
// Android (where the native module is absent). Wrapped in try/catch to be
// safe across builds where the package hasn't been linked yet.

import { Platform } from 'react-native';
import {
  OAuthProvider,
  signInWithCredential,
  type User as FbUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { Passenger } from '@yb/shared';
import { getDb, getFbAuth } from './firebase/index';

interface ExpoAppleAuthLike {
  isAvailableAsync: () => Promise<boolean>;
  signInAsync: (opts: {
    requestedScopes: Array<unknown>;
  }) => Promise<{
    identityToken: string | null;
    user: string;
    email?: string | null;
    fullName?: { givenName?: string | null; familyName?: string | null } | null;
  }>;
  AppleAuthenticationScope: {
    FULL_NAME: unknown;
    EMAIL: unknown;
  };
}

function tryLoad(): ExpoAppleAuthLike | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-apple-authentication') as ExpoAppleAuthLike;
  } catch {
    return null;
  }
}

/**
 * Whether the device supports Sign in with Apple. Returns false on Android
 * and on older iOS that pre-dates iOS 13. Use to gate the button render.
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  const mod = tryLoad();
  if (!mod) return false;
  try {
    return await mod.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Open the native Apple sign-in sheet, exchange the identity token for a
 * Firebase OAuth credential, and sign in. If the resulting Firebase user has
 * no `/users/{uid}` Passenger doc yet, create one with the name Apple gave us
 * (Apple only returns name on the very first sign-in, never on subsequent
 * sign-ins — so the create-on-first-sign-in path is the only chance to seed
 * `displayName`).
 *
 * Throws on user cancellation (with code 'ERR_CANCELED' from
 * expo-apple-authentication) — caller should treat that as a silent no-op.
 */
export async function signInWithApple(): Promise<FbUser> {
  const mod = tryLoad();
  if (!mod) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  const credential = await mod.signInAsync({
    requestedScopes: [
      mod.AppleAuthenticationScope.FULL_NAME,
      mod.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token. Try again.');
  }

  // Firebase OAuthProvider wraps Apple's token into a credential the SDK
  // accepts. The provider id 'apple.com' is what Firebase expects.
  const provider = new OAuthProvider('apple.com');
  const fbCredential = provider.credential({
    idToken: credential.identityToken,
  });

  const cred = await signInWithCredential(getFbAuth()!, fbCredential);

  // Create the passenger profile doc on first sign-in. Apple only returns
  // `fullName` and `email` on the FIRST sign-in for a given Apple ID — never
  // again. So we must seize this single opportunity to seed the name.
  const db = getDb()!;
  const userRef = doc(db, 'users', cred.user.uid);
  const existing = await getDoc(userRef);
  if (!existing.exists()) {
    const given = credential.fullName?.givenName?.trim() ?? '';
    const family = credential.fullName?.familyName?.trim() ?? '';
    const fullName = [given, family].filter(Boolean).join(' ') || 'Apple User';

    const profile: Passenger = {
      id: cred.user.uid,
      role: 'passenger',
      name: fullName,
      // Apple may return null/missing email if the user picked Hide My Email
      // — Firebase will have a relay address (`*.privaterelay.appleid.com`).
      // That's still valid as the canonical email.
      email: credential.email ?? cred.user.email ?? '',
      phone: '',
      isActive: true,
      totalTrips: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await setDoc(userRef, {
      ...profile,
      serverCreatedAt: serverTimestamp(),
    });
  }

  return cred.user;
}
