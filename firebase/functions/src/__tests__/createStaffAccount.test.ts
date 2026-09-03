import { describe, expect, it, beforeEach, vi } from 'vitest';
import { FakeFirestore, invokeCallable, callableError } from './helpers/http';

const { fake, auth } = vi.hoisted(() => ({
  fake: { db: null as unknown },
  auth: {
    createUser: vi.fn(),
    deleteUser: vi.fn(),
    getAuth: () => ({ createUser: auth.createUser, deleteUser: auth.deleteUser }),
  },
}));
vi.mock('firebase-admin/auth', () => ({ getAuth: auth.getAuth }));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => fake.db,
  FieldValue: { serverTimestamp: () => ({}), increment: () => ({}) },
}));

import { createStaffAccount, validateCreateStaffInput } from '../createStaffAccount';

const ADMIN = { uid: 'admin-1' };

describe('validateCreateStaffInput', () => {
  it('rejects a missing or invalid role', () => {
    expect(validateCreateStaffInput(undefined)).toMatchObject({ code: 'invalid-argument' });
    expect(validateCreateStaffInput({ role: 'owner' as never, email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' })).toMatchObject({
      message: 'role must be "staff" or "driver".',
    });
  });

  it('rejects missing required fields', () => {
    expect(
      validateCreateStaffInput({ role: 'staff', email: 'a@b.c', password: '12345678', name: 'A', phone: '' }),
    ).toMatchObject({ message: 'email, password, name, and phone are required.' });
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(
      validateCreateStaffInput({ role: 'staff', email: 'a@b.c', password: 'short', name: 'A', phone: '0801' }),
    ).toMatchObject({ message: 'Password must be at least 8 characters.' });
  });

  it('accepts a valid staff or driver payload', () => {
    expect(validateCreateStaffInput({ role: 'staff', email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' })).toBeNull();
    expect(
      validateCreateStaffInput({ role: 'driver', email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' }),
    ).toBeNull();
  });
});

describe('createStaffAccount handler', () => {
  beforeEach(() => {
    fake.db = new FakeFirestore();
    (fake.db as FakeFirestore).seed('users/admin-1', { role: 'admin' });
    auth.createUser.mockReset();
    auth.deleteUser.mockReset();
    auth.createUser.mockImplementation(async () => ({ uid: 'new-uid-1', email: 'a@b.c' }));
    auth.deleteUser.mockImplementation(async () => undefined);
  });

  const invoke = (data: unknown, caller: { uid: string } | undefined) =>
    invokeCallable(createStaffAccount as (req: unknown, res: unknown) => unknown, { data, auth: caller });

  it('requires authentication', async () => {
    const res = await invoke({ role: 'staff', email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' }, undefined);
    const err = callableError(res);
    expect(err.code).toBe('unauthenticated');
    expect(err.status).toBe(401);
  });

  it('rejects non-admins with permission-denied', async () => {
    (fake.db as FakeFirestore).seed('users/user-9', { role: 'staff' });
    const res = await invoke({}, { uid: 'user-9' });
    expect(callableError(res).code).toBe('permission-denied');
  });

  it('rejects an unknown role without touching auth or firestore', async () => {
    const res = await invoke({ role: 'manager', email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' }, ADMIN);
    expect(callableError(res).code).toBe('invalid-argument');
    expect(auth.createUser).not.toHaveBeenCalled();
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('rejects a short password before creating the auth user', async () => {
    const res = await invoke({ role: 'staff', email: 'a@b.c', password: 'tiny', name: 'A', phone: '0801' }, ADMIN);
    expect(callableError(res)).toMatchObject({ code: 'invalid-argument', status: 400 });
    expect(auth.createUser).not.toHaveBeenCalled();
  });

  it('maps auth signup failures to already-exists', async () => {
    auth.createUser.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    const res = await invoke({ role: 'staff', email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' }, ADMIN);
    expect(callableError(res).code).toBe('already-exists');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('creates a staff account with default permissions and mirrors to /users', async () => {
    const res = await invoke({ role: 'staff', email: 'staff@yb.com', password: '12345678', name: 'Stella', phone: '+234801' }, ADMIN);
    expect(res.status).toBe(200);
    expect((res.body as { result?: { uid?: string } }).result).toEqual({ uid: 'new-uid-1' });

    expect(auth.createUser).toHaveBeenCalledWith({
      email: 'staff@yb.com',
      password: '12345678',
      displayName: 'Stella',
      phoneNumber: '+234801',
    });

    const db = fake.db as FakeFirestore;
    const staff = await db.doc('staff/new-uid-1').get();
    expect(staff.data()).toMatchObject({
      id: 'new-uid-1',
      role: 'staff',
      email: 'staff@yb.com',
      isActive: true,
      permissions: ['assign_drivers', 'view_bookings', 'view_fleet'],
      createdBy: 'admin-1',
    });
    expect(typeof (staff.data() as { createdAt?: unknown }).createdAt).toBe('number');
    const user = await db.doc('users/new-uid-1').get();
    expect(user.data()).toMatchObject({ id: 'new-uid-1', role: 'staff' });
  });

  it('rolls back the auth user when a driver profile is missing vehicle info', async () => {
    const res = await invoke({ role: 'driver', email: 'd@yb.com', password: '12345678', name: 'Dan', phone: '0802' }, ADMIN);
    expect(callableError(res)).toMatchObject({ code: 'invalid-argument', message: 'vehicle and carTypeId are required when role="driver".' });
    expect(auth.createUser).toHaveBeenCalledTimes(1);
    expect(auth.deleteUser).toHaveBeenCalledWith('new-uid-1');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('creates an inactive-by-default driver account with vehicle and carTypeId', async () => {
    const vehicle = { make: 'Toyota', model: 'Camry', year: 2020, plate: 'ABC-123', color: 'Black' };
    const res = await invoke({ role: 'driver', email: 'd@yb.com', password: '12345678', name: 'Dan', phone: '0802', vehicle, carTypeId: 'standard' }, ADMIN);
    expect(res.status).toBe(200);

    const db = fake.db as FakeFirestore;
    const driver = await db.doc('drivers/new-uid-1').get();
    expect(driver.data()).toMatchObject({
      role: 'driver',
      vehicle,
      carTypeId: 'standard',
      documents: {},
      status: 'offline',
      totalTrips: 0,
      totalEarningsKobo: 0,
      isActive: false,
      approvedAt: null,
      approvedBy: null,
    });
    expect(auth.deleteUser).not.toHaveBeenCalled();
  });

  it('rolls back the auth user when the firestore write fails', async () => {
    const db = fake.db as FakeFirestore;
    const originalDoc = db.doc.bind(db);
    db.doc = (path: string) => {
      if (path.startsWith('staff/')) {
        return {
          ...originalDoc(path),
          set: async () => {
            throw new Error('simulated firestore failure');
          },
        };
      }
      return originalDoc(path);
    };

    const res = await invoke({ role: 'staff', email: 'a@b.c', password: '12345678', name: 'A', phone: '0801' }, ADMIN);
    expect(callableError(res).code).toBe('internal');
    expect(auth.deleteUser).toHaveBeenCalledWith('new-uid-1');
  });
});
