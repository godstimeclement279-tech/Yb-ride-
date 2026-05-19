import { getApp } from './index';
import {
  getFunctions,
  httpsCallable,
  type Functions,
} from 'firebase/functions';

// All Cloud Functions live in europe-west1 to match Firestore + RTDB.
const REGION = 'europe-west1';

let _fns: Functions | null = null;

function getFns(): Functions | null {
  if (_fns) return _fns;
  const app = getApp();
  if (!app) return null;
  _fns = getFunctions(app, REGION);
  return _fns;
}

interface CreateStaffArgs {
  role: 'staff' | 'driver';
  email: string;
  password: string;
  name: string;
  phone: string;
  permissions?: Array<
    'assign_drivers' | 'view_bookings' | 'view_fleet' | 'cancel_bookings'
  >;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    plate: string;
    color: string;
  };
  carTypeId?: string;
}

interface CreateStaffResult {
  uid: string;
}

/**
 * Server-side staff/driver onboarding. The callable runs in europe-west1
 * with the Admin SDK so it can create the Firebase Auth user with a
 * password — something the browser SDK cannot do.
 *
 * Caller must be signed in as an admin (role='admin' in /users/{uid}).
 * Surface the friendly error message to the operator on failure.
 */
export async function createStaffViaCallable(
  args: CreateStaffArgs,
): Promise<CreateStaffResult> {
  const fns = getFns();
  if (!fns) {
    throw new Error('Firebase not configured.');
  }
  const fn = httpsCallable<CreateStaffArgs, CreateStaffResult>(
    fns,
    'createStaffAccount',
  );
  const res = await fn(args);
  return res.data;
}
