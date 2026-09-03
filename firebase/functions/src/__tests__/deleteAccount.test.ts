import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FakeFirestore, invokeCallable, callableError } from './helpers/http';

const { fake, auth } = vi.hoisted(() => ({
  fake: { db: null as unknown },
  auth: {
    deleteUser: vi.fn(),
    getAuth: () => ({ deleteUser: auth.deleteUser }),
  },
}));
vi.mock('firebase-admin/auth', () => ({ getAuth: auth.getAuth }));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => fake.db,
  FieldValue: { serverTimestamp: () => ({}), increment: () => ({}) },
}));

import { deleteAccount, validateDeleteAccountInput } from '../deleteAccount';

const ADMIN = { uid: 'admin-1' };

describe('validateDeleteAccountInput', () => {
  it('rejects a missing/invalid role and a missing uid', () => {
    expect(validateDeleteAccountInput(undefined, 'admin-1')).toMatchObject({
      code: 'invalid-argument',
      message: 'role must be "staff" or "driver".',
    });
    expect(validateDeleteAccountInput({ role: 'staff', uid: '' }, 'admin-1')).toMatchObject({
      code: 'invalid-argument',
      message: 'uid is required.',
    });
  });

  it('blocks admins from deleting themselves', () => {
    expect(validateDeleteAccountInput({ role: 'staff', uid: 'admin-1' }, 'admin-1')).toMatchObject({
      code: 'failed-precondition',
      message: 'Admins cannot delete themselves.',
    });
  });

  it('accepts deleting another staff or driver', () => {
    expect(validateDeleteAccountInput({ role: 'staff', uid: 's1' }, 'admin-1')).toBeNull();
    expect(validateDeleteAccountInput({ role: 'driver', uid: 'd1' }, 'admin-1')).toBeNull();
  });
});

describe('deleteAccount handler', () => {
  beforeEach(() => {
    fake.db = new FakeFirestore();
    (fake.db as FakeFirestore).seed('users/admin-1', { role: 'admin' });
    auth.deleteUser.mockReset();
    auth.deleteUser.mockImplementation(async () => undefined);
  });

  const invoke = (data: unknown, caller: { uid: string } | undefined) =>
    invokeCallable(deleteAccount as (req: unknown, res: unknown) => unknown, { data, auth: caller });

  it('requires authentication and admin role', async () => {
    expect(callableError(await invoke(undefined, undefined)).code).toBe('unauthenticated');
    (fake.db as FakeFirestore).seed('users/pleb', { role: 'staff' });
    expect(callableError(await invoke({ role: 'staff', uid: 's1' }, { uid: 'pleb' })).code).toBe('permission-denied');
  });

  it('deletes the staff and users docs plus the auth user', async () => {
    (fake.db as FakeFirestore).seed('staff/s1', { id: 's1', role: 'staff' });
    (fake.db as FakeFirestore).seed('users/s1', { id: 's1', role: 'staff' });

    const res = await invoke({ role: 'staff', uid: 's1' }, ADMIN);
    expect(res.status).toBe(200);
    expect((res.body as { result?: unknown }).result).toEqual({ ok: true });

    const db = fake.db as FakeFirestore;
    expect((await db.doc('staff/s1').get()).exists).toBe(false);
    expect((await db.doc('users/s1').get()).exists).toBe(false);
    expect(auth.deleteUser).toHaveBeenCalledWith('s1');
    // Bookings must be left intact.
    db.seed('bookings/b1', { passengerId: 'p1' });
    expect((await db.doc('bookings/b1').get()).exists).toBe(true);
  });

  it('deletes the drivers collection for driver role', async () => {
    (fake.db as FakeFirestore).seed('drivers/d1', { id: 'd1', role: 'driver' });
    (fake.db as FakeFirestore).seed('users/d1', { id: 'd1', role: 'driver' });

    await invoke({ role: 'driver', uid: 'd1' }, ADMIN);
    const db = fake.db as FakeFirestore;
    expect((await db.doc('drivers/d1').get()).exists).toBe(false);
    expect(auth.deleteUser).toHaveBeenCalledWith('d1');
  });

  it('tolerates a missing target user-not-found in auth', async () => {
    auth.deleteUser.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    const res = await invoke({ role: 'staff', uid: 'ghost' }, ADMIN);
    expect(res.status).toBe(200);
    expect((res.body as { result?: unknown }).result).toEqual({ ok: true });
  });

  it('surfaces auth failures other than user-not-found as internal', async () => {
    auth.deleteUser.mockRejectedValueOnce(new Error('auth/invalid-credentials'));
    const res = await invoke({ role: 'staff', uid: 's1' }, ADMIN);
    expect(callableError(res)).toMatchObject({ code: 'internal', status: 500 });
  });
});
