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
import type { Driver } from '@yb/shared';
import { FIREBASE_CONFIGURED, getFbAuth } from '../services/firebase/index';
import {
  fetchDriverProfile,
  mapAuthError,
  signInDriver,
  signOutDriver,
} from '../services/firebase/driverAuthService';
import { subscribeDriver } from '../services/firebase/driversService';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../services/notifications';

// ─── Auth model ────────────────────────────────────────────────────────────
// Drivers DO NOT self-register. Admin creates the Firebase Auth user + the
// /drivers/{uid} doc via the createStaffAccount Cloud Function (role='driver').
// This context just signs the driver in and keeps the profile fresh so admin
// can revoke access in real time by flipping isActive.

interface AuthContextValue {
  user: Driver | null;
  isAuthed: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(FIREBASE_CONFIGURED);
  const [error, setError] = useState<string | null>(null);

  // ── Watch Firebase Auth + driver doc ────────────────────────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    const auth = getFbAuth()!;
    let unsubDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
      unsubDoc?.();
      unsubDoc = undefined;

      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const driver = await fetchDriverProfile(fbUser.uid);
      if (!driver) {
        await signOutDriver().catch(() => {});
        setUser(null);
        setError('No driver account is linked to this email. Ask admin to add you.');
        setLoading(false);
        return;
      }
      if (!driver.isActive) {
        await signOutDriver().catch(() => {});
        setUser(null);
        setError('Your account is not yet approved by admin.');
        setLoading(false);
        return;
      }

      setUser(driver);
      setLoading(false);
      setError(null);

      // Fire-and-forget — push registration shouldn't block sign-in.
      registerForPushNotifications(driver.id).catch((err) => {
        if (__DEV__) console.warn('driver registerForPushNotifications failed', err);
      });

      // Track admin flips to isActive / approval / suspension in real time.
      unsubDoc = subscribeDriver(driver.id, (fresh) => {
        if (!fresh) {
          signOutDriver().catch(() => {});
          setUser(null);
          setError('Your account was removed by admin.');
          return;
        }
        if (!fresh.isActive) {
          signOutDriver().catch(() => {});
          setUser(null);
          setError('Your account was suspended by admin.');
          return;
        }
        setUser(fresh);
      });
    });

    return () => {
      unsubAuth();
      unsubDoc?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInDriver(email, password);
      // onAuthStateChanged above takes over and sets loading=false after the
      // profile resolves.
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setError(mapAuthError(code));
      setLoading(false);
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    const previousId = user?.id;
    try {
      await signOutDriver();
    } finally {
      if (previousId) {
        unregisterPushNotifications(previousId).catch(() => {});
      }
    }
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthed: user !== null,
      loading,
      error,
      signIn,
      signOut,
    }),
    [user, loading, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
