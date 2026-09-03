import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Self-service account deletion for passengers and drivers. Required by
// App Store guideline 5.1.1(v): every app that lets a user create an
// account must let that same user delete it without contacting support.
//
// This is the SELF-DELETE companion to deleteAccount (which is admin-only
// and deletes OTHER accounts). The caller-uid is derived from req.auth so
// no client-supplied role/uid is trusted; this also makes the callable
// safe to expose with public Cloud Run invoker.
//
// Staff and admin accounts are intentionally NOT deletable through this
// path — those roles are admin-provisioned internal users; deactivate via
// the admin dashboard's Staff CRUD page instead. Trying to call this as
// staff or admin returns failed-precondition.
//
// Bookings/trips are NOT cascade-deleted so historical reports stay
// intact. The user's Auth identity and profile docs are removed so they
// can no longer sign in.

type Role = 'passenger' | 'driver';

export function isSupportedRole(role: unknown): role is Role {
  return role === 'passenger' || role === 'driver';
}

export interface SelfDeleteGateError {
  code: 'failed-precondition';
  message: string;
}

// Decides whether a role may self-delete. A missing role (orphaned auth
// user) is allowed through — the handler still wipes Auth so the user can
// re-enter a clean state.
export function selfDeleteGate(role: string | undefined): SelfDeleteGateError | null {
  if (role && !isSupportedRole(role)) {
    return {
      code: 'failed-precondition',
      message:
        role === 'staff' || role === 'admin'
          ? 'Staff and admin accounts are managed by an administrator. Contact YB Ride to be removed.'
          : 'This account role cannot self-delete.',
    };
  }
  return null;
}

export const deleteMyAccount = onCall(
  { region: 'europe-west1' },
  async (req) => {
    const callerUid = req.auth?.uid;
    if (!callerUid) {
      throw new HttpsError('unauthenticated', 'Sign in to delete your account.');
    }

    const db = getFirestore();

    // Derive role from /users/{uid} so the client can't lie about who
    // they are. If the doc is missing, the auth user is orphaned — still
    // wipe Auth so they can re-enter clean state.
    const userSnap = await db.doc(`users/${callerUid}`).get();
    const role = userSnap.exists ? (userSnap.data()?.role as string | undefined) : undefined;

    const gate = selfDeleteGate(role);
    if (gate) throw new HttpsError(gate.code, gate.message);

    // Best-effort Firestore wipes — if Auth delete fails after this, the
    // user is already locked out of the apps because the auth gates check
    // /users/{uid} and /drivers/{uid}.
    if (role === 'driver') {
      await db.doc(`drivers/${callerUid}`).delete().catch((err) => {
        logger.warn(`delete drivers/${callerUid} failed (continuing)`, err);
      });
    }
    await db.doc(`users/${callerUid}`).delete().catch((err) => {
      logger.warn(`delete users/${callerUid} failed (continuing)`, err);
    });

    try {
      await getAuth().deleteUser(callerUid);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/user-not-found') {
        logger.error('deleteUser failed', err);
        throw new HttpsError('internal', 'Could not remove the auth user. Try again.');
      }
    }

    logger.info('deleteMyAccount success', { uid: callerUid, role: role ?? 'unknown' });
    return { ok: true };
  },
);
