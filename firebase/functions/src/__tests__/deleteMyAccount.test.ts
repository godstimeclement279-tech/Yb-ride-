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

import { deleteMyAccount, selfDeleteGate, isSupportedRole } from '../deleteMyAccount';

describe('selfDeleteGate', () => {
  it('allows passengers, drivers, and missing roles (orphaned accounts)', () => {
    expect(selfDeleteGate('passenger')).toBeNull();
    expect(selfDeleteGate('driver')).toBeNull();
    expect(selfDeleteGate(undefined)).toBeNull();
  });

  it('blocks staff and admin with the managed-account message', () => {
    expect(selfDeleteGate('staff')).toMatchObject({
      code: 'failed-precondition',
      message: 'Staff and admin accounts are managed by an administrator. Contact YB Ride to be removed.',
    });
    expect(selfDeleteGate('admin')).toMatchObject({ code: 'failed-precondition' });
  });

  it('blocks unknown roles with a generic message', () => {
    expect(selfDeleteGate('superadmin')).toMatchObject({
      code: 'failed-precondition',
      message: 'This account role cannot self-delete.',
    });
  });

  it('only recognizes passenger and driver as supported roles', () => {
    expect(isSupportedRole('passenger')).toBe(true);
    expect(isSupportedRole('driver')).toBe(true);
    expect(isSupportedRole('staff')).toBe(false);
    expect(isSupportedRole('admin')).toBe(false);
    expect(isSupportedRole(undefined)).toBe(false);
  });
});

describe('deleteMyAccount handler', () => {
  beforeEach(() => {
    fake.db = new FakeFirestore();
    auth.deleteUser.mockReset();
    auth.deleteUser.mockImplementation(async () => undefined);
  });

  const invoke = (caller: { uid: string } | undefined) =>
    invokeCallable(deleteMyAccount as (req: unknown, res: unknown) => unknown, { data: {}, auth: caller });

  it('requires authentication', async () => {
    expect(callableError(await invoke(undefined)).code).toBe('unauthenticated');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('deletes the users doc and the auth user for a passenger', async () => {
    (fake.db as FakeFirestore).seed('users/p1', { id: 'p1', role: 'passenger' });
    (fake.db as FakeFirestore).seed('drivers/p1', { id: 'p1', role: 'driver' }); // must NOT be touched

    const res = await invoke({ uid: 'p1' });
    expect(res.status).toBe(200);
    expect((res.body as { result?: unknown }).result).toEqual({ ok: true });

    const db = fake.db as FakeFirestore;
    expect((await db.doc('users/p1').get()).exists).toBe(false);
    expect((await db.doc('drivers/p1').get()).exists).toBe(true);
    expect(auth.deleteUser).toHaveBeenCalledWith('p1');
  });

  it('also deletes the drivers doc when the caller is a driver', async () => {
    (fake.db as FakeFirestore).seed('users/d1', { id: 'd1', role: 'driver' });
    (fake.db as FakeFirestore).seed('drivers/d1', { id: 'd1', role: 'driver' });

    await invoke({ uid: 'd1' });
    const db = fake.db as FakeFirestore;
    expect((await db.doc('users/d1').get()).exists).toBe(false);
    expect((await db.doc('drivers/d1').get()).exists).toBe(false);
    expect(auth.deleteUser).toHaveBeenCalledWith('d1');
  });

  it('refuses staff and admin without deleting anything', async () => {
    (fake.db as FakeFirestore).seed('users/s1', { id: 's1', role: 'staff' });
    const err = callableError(await invoke({ uid: 's1' }));
    expect(err.code).toBe('failed-precondition');
    expect(err.message).toContain('managed by an administrator');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
    expect(auth.deleteUser).not.toHaveBeenCalled();
  });

  it('refuses unknown roles with the generic message', async () => {
    (fake.db as FakeFirestore).seed('users/x1', { id: 'x1', role: 'contractor' });
    const err = callableError(await invoke({ uid: 'x1' }));
    expect(err).toMatchObject({ code: 'failed-precondition', message: 'This account role cannot self-delete.' });
  });

  it('still wipes the orphaned auth user when the users doc is missing', async () => {
    const res = await invoke({ uid: 'ghost' });
    expect(res.status).toBe(200);
    expect(auth.deleteUser).toHaveBeenCalledWith('ghost');
  });
});
