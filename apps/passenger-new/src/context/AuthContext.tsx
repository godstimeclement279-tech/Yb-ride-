import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { onAuthStateChanged, type User as FbUser } from 'firebase/auth';
import type { Passenger } from '@yb/shared';
import {
  FIREBASE_CONFIGURED,
  getFbAuth,
} from '../services/firebase/index';
import {
  fetchPassengerProfile,
  mapAuthError,
  signInPassenger,
  signOutPassenger,
  signUpPassenger,
} from '../services/firebase/passengerAuthService';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../services/notifications';

// ─── Auth state shape ──────────────────────────────────────────────────────

export type AuthStatus =
  | 'loading'      // Resolving persisted Firebase Auth session on first load.
  | 'signed_out'
  | 'signed_in'
  | 'error';

interface AuthContextValue {
  status: AuthStatus;
  user: Passenger | null;
  errorMessage?: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    phone: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(
    FIREBASE_CONFIGURED ? 'loading' : 'signed_out',
  );
  const [user, setUser] = useState<Passenger | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Watch Firebase Auth, resolve the /users/{uid} doc, register push.
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const auth = getFbAuth()!;
    return onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
      if (!fbUser) {
        setUser(null);
        setStatus('signed_out');
        return;
      }
      const profile = await fetchPassengerProfile(fbUser.uid);
      if (!profile) {
        // Auth user exists but no passenger profile — treat as a stale
        // session and bounce them back to sign-in.
        await signOutPassenger().catch(() => {});
        setUser(null);
        setStatus('signed_out');
        setErrorMessage('Your account is missing a profile. Sign up again.');
        return;
      }
      setUser(profile);
      setStatus('signed_in');
      setErrorMessage(undefined);
      registerForPushNotifications(profile.id).catch((err) => {
        if (__DEV__) console.warn('register push failed', err);
      });
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setErrorMessage(undefined);
    try {
      await signInPassenger(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setStatus('error');
      setErrorMessage(mapAuthError(code));
      throw err;
    }
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      phone: string;
    }) => {
      setErrorMessage(undefined);
      try {
        await signUpPassenger(input);
        // onAuthStateChanged handler picks up the new session and routes us in.
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? '';
        setStatus('error');
        setErrorMessage(mapAuthError(code));
        throw err;
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const previousId = user?.id;
    try {
      await signOutPassenger();
    } finally {
      if (previousId) {
        unregisterPushNotifications(previousId).catch(() => {});
      }
    }
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      errorMessage,
      signIn,
      signUp,
      signOut,
    }),
    [status, user, errorMessage, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/**
 * Asserts the passenger is signed in and returns the non-null profile.
 * Screens rendered only inside the signed-in subtree can use this so they
 * don't have to guard against null on every property access.
 */
export function usePassenger(): Passenger {
  const { user } = useAuth();
  if (!user) {
    throw new Error('usePassenger called while signed out — wrap in <SignedInGate>.');
  }
  return user;
}
