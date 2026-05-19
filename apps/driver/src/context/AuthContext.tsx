import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Driver } from '@yb/shared';
import { MOCK_DRIVER } from '../data/mockData';
import { FIREBASE_CONFIGURED } from '../services/firebase/index';
import { findDriverByPhone, subscribeDriver } from '../services/firebase/driversService';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../services/notifications';

// ─── Auth model (MVP) ──────────────────────────────────────────────────────
// Drivers do NOT self-register. Admin creates the account in the admin
// dashboard with `phone` + `password`. Driver logs in here with those creds.
// Pre-Auth MVP: phone-lookup against Firestore + a hardcoded shared password.
// Real Firebase Auth (phone OTP) lands in a follow-up pass.

const DEMO_PASSWORD = 'driver123';
const DEMO_FALLBACK_PHONE = '+2348012345678';

interface AuthContextValue {
  user: Driver | null;
  isAuthed: boolean;
  loading: boolean;
  error: string | null;
  signIn: (phone: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once authed, keep the driver record fresh (admin may toggle isActive remotely).
  useEffect(() => {
    if (!user || !FIREBASE_CONFIGURED) return;
    const unsub = subscribeDriver(user.id, fresh => {
      if (!fresh) {
        // Driver doc deleted by admin → force sign-out.
        setUser(null);
        setError('Your account is no longer active.');
        return;
      }
      setUser(fresh);
    });
    return unsub;
  }, [user?.id]);

  const signIn = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);

    if (password !== DEMO_PASSWORD) {
      setError('Invalid phone or password');
      setLoading(false);
      return false;
    }

    // Try Firestore lookup first; fall back to MOCK_DRIVER if disabled / offline.
    let driver: Driver | null = null;
    if (FIREBASE_CONFIGURED) {
      try {
        driver = await findDriverByPhone(phone);
      } catch (err) {
        if (__DEV__) console.warn('findDriverByPhone error', err);
      }
    }
    if (!driver) {
      const fallbackOk = phone.trim() === DEMO_FALLBACK_PHONE;
      if (!fallbackOk) {
        setError(
          FIREBASE_CONFIGURED
            ? 'No driver account found for that phone. Ask admin to add you.'
            : 'Invalid phone or password',
        );
        setLoading(false);
        return false;
      }
      driver = MOCK_DRIVER;
    }

    if (!driver.isActive) {
      setError('Account not yet approved by admin');
      setLoading(false);
      return false;
    }
    setUser(driver);
    setLoading(false);
    // Fire-and-forget — push registration shouldn't block sign-in.
    registerForPushNotifications(driver.id).catch((err) => {
      if (__DEV__) console.warn('driver registerForPushNotifications failed', err);
    });
    return true;
  }, []);

  const signOut = useCallback(() => {
    const previousId = user?.id;
    setUser(null);
    setError(null);
    if (previousId) {
      unregisterPushNotifications(previousId).catch((err) => {
        if (__DEV__) console.warn('driver unregisterPushNotifications failed', err);
      });
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

export const DEMO_LOGIN = {
  phone: DEMO_FALLBACK_PHONE,
  password: DEMO_PASSWORD,
};
