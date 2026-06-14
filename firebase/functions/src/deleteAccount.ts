import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// Admin-only callable that removes a staff or driver account. Deletes the
// Firebase Auth user (so they can no longer sign in) and the matching
// /staff/{uid} or /drivers/{uid} doc plus /users/{uid}. Bookings remain
// untouched so historical reports stay intact.

type Role = 'staff' | 'driver';

interface DeleteAccountInput {
  role: Role;
  uid: string;
}

async function assertCallerIsAdmin(uid: string | undefined): Promise<void> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in as an admin to call this.');
  }
  const snap = await getFirestore().doc(`users/${uid}`).get();
  const role = snap.exists ? (snap.data()?.role as string | undefined) : undefined;
  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can delete accounts.');
  }
}

export const deleteAccount = onCall<DeleteAccountInput>(
  { region: 'europe-west1' },
  async (req) => {
    await assertCallerIsAdmin(req.auth?.uid);

    const { role, uid } = req.data;
    if (role !== 'staff' && role !== 'driver') {
      throw new HttpsError('invalid-argument', 'role must be "staff" or "driver".');
    }
    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid is required.');
    }
    if (uid === req.auth?.uid) {
      throw new HttpsError('failed-precondition', 'Admins cannot delete themselves.');
    }

    const db = getFirestore();
    const collection = role === 'staff' ? 'staff' : 'drivers';

    // Wipe Firestore docs first — if Auth delete fails after this, the user
    // is already locked out of the apps because the gates check /staff/{uid}
    // and /drivers/{uid}.
    await db.doc(`${collection}/${uid}`).delete().catch((err) => {
      logger.warn(`delete ${collection}/${uid} failed (continuing)`, err);
    });
    await db.doc(`users/${uid}`).delete().catch((err) => {
      logger.warn(`delete users/${uid} failed (continuing)`, err);
    });

    try {
      await getAuth().deleteUser(uid);
    } catch (err) {
      // user-not-found is OK — already gone.
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/user-not-found') {
        logger.error('deleteUser failed', err);
        throw new HttpsError('internal', 'Could not remove the auth user. Try again.');
      }
    }

    logger.info('deleteAccount success', { uid, role, deletedBy: req.auth?.uid });
    return { ok: true };
  },
);
