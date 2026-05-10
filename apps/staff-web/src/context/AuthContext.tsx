import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FbUser,
} from 'firebase/auth';
import type { Staff } from '@yb/shared';
import { FIREBASE_CONFIGURED, getFbAuth } from '../services/firebase';
import { fetchStaffProfile, subscribeStaffProfile } from '../services/firebase/staffService';
import { mockStaff } from '../data/mock';

// ─── Auth state shape ───────────────────────────────────────────────────────

export type AuthStatus =
  | 'loading'        // First render — checking persisted Firebase Auth session
  | 'signed_out'
  | 'signed_in'
  | 'unauthorized'   // Auth user exists but no /staff/{uid} doc OR isActive=false
  | 'error';

interface AuthContextValue {
  status: AuthStatus;
  staff: Staff | null;
  errorMessage?: string;
  /** Whether Firebase is wired up — UI uses this to surface a banner. */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOutNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo / fallback staff used when Firebase isn't configured yet, so the UI is
// previewable without a real backend.
const DEMO_STAFF: Staff = mockStaff[0]!;
const DEMO_PASSWORD = 'demo';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    FIREBASE_CONFIGURED ? 'loading' : 'signed_out',
  );
  const [staff, setStaff] = useState<Staff | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // ── Watch Firebase Auth session and the /staff/{uid} doc ──────────────────
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    const auth = getFbAuth()!;
    let unsubStaffDoc: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser: FbUser | null) => {
      // Tear down the previous staff doc subscription first.
      unsubStaffDoc?.();
      unsubStaffDoc = undefined;

      if (!fbUser) {
        setStaff(null);
        setStatus('signed_out');
        return;
      }

      // Check the role doc — admin must have created it. If it isn't there,
      // sign them out so they can't sit in a half-authed state.
      const profile = await fetchStaffProfile(fbUser.uid);
      if (!profile) {
        await signOut(auth);
        setStaff(null);
        setStatus('unauthorized');
        setErrorMessage(
          'No staff profile for this account. Ask an admin to grant access.',
        );
        return;
      }
      if (!profile.isActive) {
        await signOut(auth);
        setStaff(null);
        setStatus('unauthorized');
        setErrorMessage('Your staff account is inactive. Contact an admin.');
        return;
      }

      setStaff(profile);
      setStatus('signed_in');
      setErrorMessage(undefined);

      // Keep permissions / isActive in sync as admin edits them.
      unsubStaffDoc = subscribeStaffProfile(fbUser.uid, (next) => {
        if (!next || !next.isActive) {
          signOut(auth).catch(() => {});
          setStatus('unauthorized');
          setErrorMessage('Access revoked by admin.');
          setStaff(null);
        } else {
          setStaff(next);
        }
      });
    });

    return () => {
      unsubAuth();
      unsubStaffDoc?.();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      setErrorMessage(undefined);

      if (!FIREBASE_CONFIGURED) {
        // Demo path: any of the seeded staff emails + 'demo'.
        const match = mockStaff.find(
          (s) => s.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!match || password !== DEMO_PASSWORD) {
          setStatus('error');
          setErrorMessage(
            `Demo login: use any seeded staff email (${DEMO_STAFF.email}) and password "demo".`,
          );
          throw new Error('Invalid demo credentials');
        }
        if (!match.isActive) {
          setStatus('unauthorized');
          setErrorMessage('That staff account is inactive (demo).');
          throw new Error('Inactive');
        }
        setStaff(match);
        setStatus('signed_in');
        return;
      }

      try {
        await signInWithEmailAndPassword(getFbAuth()!, email.trim(), password);
        // onAuthStateChanged handler above will continue the flow.
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? '';
        const message = friendlyAuthError(code);
        setStatus('error');
        setErrorMessage(message);
        throw err;
      }
    },
    [],
  );

  const signOutNow = useCallback(async (): Promise<void> => {
    if (!FIREBASE_CONFIGURED) {
      setStaff(null);
      setStatus('signed_out');
      return;
    }
    await signOut(getFbAuth()!);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      staff,
      errorMessage,
      configured: FIREBASE_CONFIGURED,
      signIn,
      signOutNow,
    }),
    [status, staff, errorMessage, signIn, signOutNow],
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
