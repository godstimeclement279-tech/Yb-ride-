import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  // Dev-only shortcut to bypass Firebase Auth when the device's JS fetch
  // path is dead (e.g. stuck cellular routes). Sets a mock signed-in user
  // so the rest of the app can be exercised locally. No-op in production
  // builds — gated by __DEV__ at the call site.
  signInDev: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Firebase Auth has no built-in client timeout — signInWithEmailAndPassword
// will sit pending forever if the device has no route to the internet (e.g.
// joined to a LAN-only dev Wi-Fi). Race it against a timer so the UI shows a
// real "check your connection" error instead of an infinite spinner.
// 60s, not 20s: Firebase Auth needs several TLS + token round-trips, and on
// a weak/throttled mobile link (seen as low K/s in the status bar) those can
// take well over 20s even though the connection technically works. Too-short
// a timeout turns a slow-but-fine login into a false "could not reach server".
const AUTH_TIMEOUT_MS = 60000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject({ code: 'app/timeout', message: label }),
        AUTH_TIMEOUT_MS,
      ),
    ),
  ]);
}

// Network failures on flaky cellular/hotspot links are intermittent —
// Firebase Auth itself does not retry them. Wrap the call in a small retry
// loop so a transient blip doesn't turn into a hard failure for the user.
function isRetryableNetworkError(code: string): boolean {
  return (
    code === 'auth/network-request-failed' ||
    code === 'app/timeout' ||
    code === 'auth/internal-error'
  );
}

async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 3000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const code = (err as { code?: string })?.code ?? '';
      if (!isRetryableNetworkError(code) || attempt === maxAttempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>(
    FIREBASE_CONFIGURED ? 'loading' : 'signed_out',
  );
  const [user, setUser] = useState<Passenger | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Watch Firebase Auth, resolve the /users/{uid} doc, register push.
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    let auth;
    try {
      auth = getFbAuth();
    } catch {
      setStatus('error');
      return;
    }
    if (!auth) {
      setStatus('error');
      return;
    }
    return onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
      if (!fbUser) {
        setUser(null);
        setStatus('signed_out');
        return;
      }
      // fetchPassengerProfile hits Firestore. On a flaky connection that
      // call can throw "Failed to get document because the client is offline"
      // which, unhandled inside an async listener, surfaces as a scary
      // "Uncaught (in promise)" overlay. Catch it and route to a clean
      // sign-out + retry message instead.
      let profile;
      try {
        profile = await fetchPassengerProfile(fbUser.uid);
      } catch {
        await signOutPassenger().catch(() => {});
        setUser(null);
        setStatus('error');
        setErrorMessage(
          'Could not reach the server to load your profile. Check your connection and try again.',
        );
        return;
      }
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
    // Dev-only diagnostic block — all logs gated by __DEV__ so production
    // builds don't leak email addresses, timing, or network failure detail.
    const t0 = Date.now();
    if (__DEV__) {
      console.log('[auth] signIn start email=', email);
      // Probe identitytoolkit (the actual Firebase Auth host) in parallel
      // so we can see exactly what the device's fetch does for THAT host
      // vs generic gstatic.
      fetch('https://www.gstatic.com/generate_204')
        .then((r) => console.log('[auth-probe] gstatic ->', r.status, 'in', Date.now() - t0, 'ms'))
        .catch((e) => console.log('[auth-probe] gstatic FAILED ->', String(e), 'after', Date.now() - t0, 'ms'));
      fetch('https://identitytoolkit.googleapis.com/', { method: 'HEAD' })
        .then((r) => console.log('[auth-probe] identitytoolkit ->', r.status, 'in', Date.now() - t0, 'ms'))
        .catch((e) => console.log('[auth-probe] identitytoolkit FAILED ->', String(e), 'after', Date.now() - t0, 'ms'));
    }
    try {
      await withNetworkRetry(() => {
        const attemptStart = Date.now();
        if (__DEV__) console.log('[auth] attempt start');
        return withTimeout(signInPassenger(email, password), 'app/timeout')
          .then((r) => {
            if (__DEV__) console.log('[auth] attempt OK in', Date.now() - attemptStart, 'ms');
            return r;
          })
          .catch((err) => {
            const e = err as { code?: string; message?: string };
            if (__DEV__) console.log('[auth] attempt FAILED code=', e?.code, 'msg=', e?.message, 'in', Date.now() - attemptStart, 'ms');
            throw err;
          });
      });
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
        await withNetworkRetry(() =>
          withTimeout(signUpPassenger(input), 'app/timeout'),
        );
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

  const signInDev = useCallback(() => {
    if (!__DEV__) return;
    const mockUser: Passenger = {
      id: 'dev-user-local',
      role: 'passenger',
      name: 'Dev Tester',
      phone: '+2349000000000',
      // Paystack rejects .test / .invalid TLDs from RFC 2606 ("email must be
      // a valid email"). Use example.com (the other reserved-but-accepted
      // dev domain) so payment flow works while skip-login is active.
      email: 'dev@example.com',
      isActive: true,
      totalTrips: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setUser(mockUser);
    setStatus('signed_in');
    setErrorMessage(undefined);
  }, []);

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
      signInDev,
    }),
    [status, user, errorMessage, signIn, signUp, signOut, signInDev],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/**
 * Returns the signed-in passenger. Screens nested inside the signed-in
 * subtree can use this without null-checks.
 *
 * Sign-out has a one-frame transient where Firebase fires setUser(null)
 * before the RootNavigator conditional re-renders to swap these screens out.
 * Throwing during that frame surfaces as a Render crash to the user, so
 * instead we hold the last known user in a ref and return it for that one
 * stale render. The screen unmounts on the next frame anyway.
 */
const lastUserRef: { current: Passenger | null } = { current: null };

export function usePassenger(): Passenger {
  const { user } = useAuth();
  const ref = useRef<Passenger | null>(lastUserRef.current);
  if (user) {
    ref.current = user;
    lastUserRef.current = user;
  }
  const resolved = user ?? ref.current ?? lastUserRef.current;
  if (!resolved) {
    // Truly never-signed-in render path. Should not happen in practice
    // because the auth gate prevents these screens from mounting then —
    // but if it does, surface a clear error rather than null-deref.
    throw new Error('usePassenger called before any user has signed in.');
  }
  return resolved;
}
