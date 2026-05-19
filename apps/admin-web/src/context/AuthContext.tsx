import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FbUser,
} from 'firebase/auth';
import { FIREBASE_CONFIGURED, getFbAuth } from '../services/firebase';
import {
  fetchAdminProfile,
  subscribeAdminProfile,
  type AdminProfile,
} from '../services/firebase/adminProfileService';

// ─── Auth state shape ──────────────────────────────────────────────────────
//
// 'unauthorized' = signed in, but /users/{uid}.role !== 'admin'. We sign the
// user back out so they don't sit in a broken half-authed state.

export type AuthStatus =
  | 'loading'
  | 'signed_out'
  | 'signed_in'
  | 'unauthorized'
  | 'error';

interface AuthContextValue {
  status: AuthStatus;
  admin: AdminProfile | null;
  errorMessage?: string;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    FIREBASE_CONFIGURED ? 'loading' : 'signed_out',
  );
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const auth = getFbAuth()!;
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
      unsubProfile?.();
      unsubProfile = undefined;

      if (!fbUser) {
        setAdmin(null);
        setStatus('signed_out');
        return;
      }

      const profile = await fetchAdminProfile(fbUser.uid);
      if (!profile) {
        await signOut(auth);
        setAdmin(null);
        setStatus('unauthorized');
        setErrorMessage(
          'This account is not an admin. Use the staff dashboard or contact YB Ride.',
        );
        return;
      }
      if (!profile.isActive) {
        await signOut(auth);
        setAdmin(null);
        setStatus('unauthorized');
        setErrorMessage('Your admin account has been disabled.');
        return;
      }

      setAdmin(profile);
      setStatus('signed_in');
      setErrorMessage(undefined);

      // Keep role + isActive fresh in case another admin demotes this user.
      unsubProfile = subscribeAdminProfile(fbUser.uid, (next) => {
        if (!next || !next.isActive) {
          signOut(auth).catch(() => {});
          setAdmin(null);
          setStatus('unauthorized');
          setErrorMessage('Admin access revoked.');
        } else {
          setAdmin(next);
        }
      });
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      setErrorMessage(undefined);
      if (!FIREBASE_CONFIGURED) {
        setStatus('error');
        setErrorMessage('Firebase is not configured for this build.');
        throw new Error('Firebase not configured');
      }
      try {
        await signInWithEmailAndPassword(getFbAuth()!, email.trim(), password);
        // onAuthStateChanged above takes over.
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? '';
        setStatus('error');
        setErrorMessage(friendlyAuthError(code));
        throw err;
      }
    },
    [],
  );

  const signOutNow = useCallback(async (): Promise<void> => {
    if (!FIREBASE_CONFIGURED) return;
    await signOut(getFbAuth()!);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      admin,
      errorMessage,
      configured: FIREBASE_CONFIGURED,
      signIn,
      signOutNow,
    }),
    [status, admin, errorMessage, signIn, signOutNow],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

function friendlyAuthError(code: string): string {
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
      return 'This account has been disabled.';
    default:
      return 'Could not sign in. Try again.';
  }
}
