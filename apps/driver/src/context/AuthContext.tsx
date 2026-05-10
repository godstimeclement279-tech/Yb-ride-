import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Driver } from '@yb/shared';
import { MOCK_DRIVER } from '../data/mockData';

// ─── Auth model (MVP) ──────────────────────────────────────────────────────
// Drivers do NOT self-register. Admin creates the account in the admin
// dashboard with `phone` + `password`. Driver logs in here with those creds.
// MVP uses a hardcoded credential pair; real Firebase Auth lands post-MVP.

const DEMO_CREDENTIALS = {
  phone: '+2348012345678',
  password: 'driver123',
};

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

  const signIn = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    setError(null);
    // simulate latency for real-feel
    await new Promise<void>(resolve => setTimeout(() => resolve(), 700));
    const ok =
      phone.trim() === DEMO_CREDENTIALS.phone &&
      password === DEMO_CREDENTIALS.password;
    if (!ok) {
      setError('Invalid phone or password');
      setLoading(false);
      return false;
    }
    if (!MOCK_DRIVER.isActive) {
      setError('Account not yet approved by admin');
      setLoading(false);
      return false;
    }
    setUser(MOCK_DRIVER);
    setLoading(false);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

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

export const DEMO_LOGIN = DEMO_CREDENTIALS;
