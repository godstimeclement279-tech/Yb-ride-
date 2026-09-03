import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// ─── createStaffAccount ─────────────────────────────────────────────────────
//
// Callable function used by the admin dashboard to onboard a new staff or
// driver account. Browser-side admin-web only has the client SDK and can't
// create Firebase Auth users with passwords — that requires the Admin SDK.
//
// Caller must be authenticated AND have role='admin' in /users/{uid}.
// Payload:
//   role: 'staff' | 'driver'
//   email: string
//   password: string  (server-issued; admin shares with the user offline)
//   name: string
//   phone: string
//   permissions?: StaffPermission[]   (only used when role='staff')
//   vehicle?: Vehicle                 (only used when role='driver')
//   carTypeId?: string                (only used when role='driver')
//
// Effect:
//   1. Creates the Firebase Auth user.
//   2. Writes /staff/{uid} or /drivers/{uid} with the profile.
//   3. Returns { uid }.

type Role = 'staff' | 'driver';

type StaffPermission =
  | 'assign_drivers'
  | 'view_bookings'
  | 'view_fleet'
  | 'cancel_bookings';

interface Vehicle {
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
}

export interface CreateStaffAccountInput {
  role: Role;
  email: string;
  password: string;
  name: string;
  phone: string;
  permissions?: StaffPermission[];
  vehicle?: Vehicle;
  carTypeId?: string;
}

export interface CreateStaffValidationError {
  code: 'invalid-argument';
  message: string;
}

// Validation that runs BEFORE creating the internal-auth user. The driver
// vehicle check stays in the handler because it happens after the auth user
// is created (and must roll it back).
export function validateCreateStaffInput(
  data: CreateStaffAccountInput | undefined,
): CreateStaffValidationError | null {
  const { role, email, password, name, phone } = data ?? {};
  if (!role || (role !== 'staff' && role !== 'driver')) {
    return { code: 'invalid-argument', message: 'role must be "staff" or "driver".' };
  }
  if (!email || !password || !name || !phone) {
    return {
      code: 'invalid-argument',
      message: 'email, password, name, and phone are required.',
    };
  }
  if (password.length < 8) {
    return { code: 'invalid-argument', message: 'Password must be at least 8 characters.' };
  }
  return null;
}

async function assertCallerIsAdmin(uid: string | undefined): Promise<void> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in as an admin to call this.');
  }
  const snap = await getFirestore().doc(`users/${uid}`).get();
  const role = snap.exists ? (snap.data()?.role as string | undefined) : undefined;
  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create accounts.');
  }
}

export const createStaffAccount = onCall<CreateStaffAccountInput>(
  { region: 'europe-west1' },
  async (req) => {
    await assertCallerIsAdmin(req.auth?.uid);

    const validation = validateCreateStaffInput(req.data);
    if (validation) throw new HttpsError(validation.code, validation.message);

    const { role, email, password, name, phone } = req.data;

    let uid: string;
    try {
      const user = await getAuth().createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone.startsWith('+') ? phone : undefined,
      });
      uid = user.uid;
    } catch (err) {
      logger.error('createUser failed', err);
      throw new HttpsError(
        'already-exists',
        'Could not create the auth user — email or phone may be in use.',
      );
    }

    const now = Date.now();
    const db = getFirestore();
    try {
      if (role === 'staff') {
        await db.doc(`staff/${uid}`).set({
          id: uid,
          role: 'staff',
          name,
          email,
          phone,
          permissions: req.data.permissions ?? [
            'assign_drivers',
            'view_bookings',
            'view_fleet',
          ],
          isActive: true,
          createdAt: now,
          updatedAt: now,
          createdBy: req.auth?.uid ?? null,
        });
      } else {
        if (!req.data.vehicle || !req.data.carTypeId) {
          // Roll the auth user back so we don't leave an orphan.
          await getAuth().deleteUser(uid).catch(() => {});
          throw new HttpsError(
            'invalid-argument',
            'vehicle and carTypeId are required when role="driver".',
          );
        }
        await db.doc(`drivers/${uid}`).set({
          id: uid,
          role: 'driver',
          name,
          email,
          phone,
          vehicle: req.data.vehicle,
          carTypeId: req.data.carTypeId,
          documents: {},
          status: 'offline',
          totalTrips: 0,
          totalEarningsKobo: 0,
          isActive: false, // requires manual approval
          createdAt: now,
          updatedAt: now,
          approvedAt: null,
          approvedBy: null,
        });
      }

      // Also mirror to /users for role checks.
      await db.doc(`users/${uid}`).set(
        { id: uid, role, email, name, phone, createdAt: now },
        { merge: true },
      );

      logger.info('createStaffAccount success', { uid, role, createdBy: req.auth?.uid });
      return { uid };
    } catch (err) {
      logger.error('createStaffAccount firestore failed; rolling back auth user', err);
      await getAuth().deleteUser(uid).catch(() => {});
      throw err instanceof HttpsError
        ? err
        : new HttpsError('internal', 'Could not finish account setup. Try again.');
    }
  },
);

// Helper used internally to bypass the field-value import warning in some
// builds. Not exported, but keeps tree-shakers happy.
const _unused = FieldValue.serverTimestamp;
void _unused;
