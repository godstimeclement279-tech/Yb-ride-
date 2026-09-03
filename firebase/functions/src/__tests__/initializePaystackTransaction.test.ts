import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { FakeFirestore, invokeCallable, callableError } from './helpers/http';

const { fake, fetchMock } = vi.hoisted(() => ({
  fake: { db: null as unknown },
  fetchMock: vi.fn(),
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => fake.db,
  FieldValue: { serverTimestamp: () => ({}), increment: () => ({}) },
}));

import {
  initializePaystackTransaction,
  validateBookingPayable,
  buildPaystackInitBody,
  type BookingDoc,
} from '../initializePaystackTransaction';

const SECRET = 'test-paystack-secret';

function bookingDoc(overrides: Partial<BookingDoc> = {}): BookingDoc {
  return {
    passengerId: 'p1',
    status: 'pending_payment',
    fare: { total: 100_000 },
    pickup: { label: 'Agbor' },
    dropoff: { label: 'Benin' },
    ...overrides,
  };
}

function paystackOk() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: true,
      message: 'success',
      data: { authorization_url: 'https://paystack/checkout/abc', access_code: 'ac_1', reference: 'yb_b1_1' },
    }),
  };
}

describe('validateBookingPayable', () => {
  it('accepts a pending_payment booking with a fare', () => {
    expect(validateBookingPayable(bookingDoc())).toBeNull();
  });

  it('rejects non-pending states with a state-specific message', () => {
    const err = validateBookingPayable(bookingDoc({ status: 'paid' }));
    expect(err).toMatchObject({ code: 'failed-precondition', message: 'Booking is already in state "paid" — nothing to pay.' });
    expect(validateBookingPayable(bookingDoc({ status: undefined }))).not.toBeNull();
  });

  it('rejects a missing or non-positive fare', () => {
    const noFare = validateBookingPayable(bookingDoc({ fare: { total: 0 } }));
    expect(noFare).toMatchObject({ code: 'failed-precondition', message: 'Booking has no fare.' });
    expect(validateBookingPayable(bookingDoc({ fare: { total: -5 } }))).toMatchObject({ message: 'Booking has no fare.' });
  });
});

describe('buildPaystackInitBody', () => {
  it('uses the default channels when none are supplied', () => {
    const body = buildPaystackInitBody(bookingDoc(), 'p1@yb.com', 'b1', undefined, 1_000);
    expect(body).toMatchObject({
      email: 'p1@yb.com',
      amount: 100_000,
      currency: 'NGN',
      reference: 'yb_b1_1000',
      channels: ['bank_transfer', 'card'],
    });
  });

  it('honours caller channels and embeds bookingId plus pickup/dropoff metadata', () => {
    const body = buildPaystackInitBody(bookingDoc(), 'p1@yb.com', 'b1', ['card'], 1_000);
    expect(body.channels).toEqual(['card']);
    expect(body.metadata).toEqual({
      bookingId: 'b1',
      custom_fields: [
        { display_name: 'Pickup', variable_name: 'pickup', value: 'Agbor' },
        { display_name: 'Dropoff', variable_name: 'dropoff', value: 'Benin' },
      ],
    });
  });

  it('falls back to empty labels when pickup/dropoff are missing', () => {
    const body = buildPaystackInitBody(bookingDoc({ pickup: undefined, dropoff: undefined }), 'a@b.c', 'b1', undefined, 1);
    const fields = (body.metadata as { custom_fields: Array<{ display_name: string; value: string }> }).custom_fields;
    expect(fields.map((f) => f.value)).toEqual(['', '']);
  });
});

describe('initializePaystackTransaction handler', () => {
  beforeEach(() => {
    fake.db = new FakeFirestore();
    (fake.db as FakeFirestore).seed('bookings/b1', bookingDoc());
    (fake.db as FakeFirestore).seed('users/p1', { email: 'p1@yb.com' });
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(paystackOk() as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const invoke = (data: unknown, caller: { uid: string } | undefined) =>
    invokeCallable(initializePaystackTransaction as (req: unknown, res: unknown) => unknown, { data, auth: caller });

  it('requires authentication', async () => {
    const res = await invoke({ bookingId: 'b1' }, undefined);
    expect(callableError(res)).toMatchObject({ code: 'unauthenticated', status: 401 });
  });

  it('rejects a missing bookingId before touching firestore', async () => {
    const res = await invoke({}, { uid: 'p1' });
    expect(callableError(res)).toMatchObject({ code: 'invalid-argument', message: 'bookingId is required.' });
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('reports not-found for missing bookings without leaking ownership', async () => {
    const missing = callableError(await invoke({ bookingId: 'nope' }, { uid: 'p1' }));
    const others = callableError(await invoke({ bookingId: 'b2' }, { uid: 'intruder' }));
    expect(missing).toMatchObject({ code: 'not-found', message: 'Booking not found.' });
    expect(others).toMatchObject({ code: 'not-found', message: 'Booking not found.' });
  });

  it('rejects bookings that are not ours with the same not-found shape', async () => {
    const err = callableError(await invoke({ bookingId: 'b1' }, { uid: 'intruder' }));
    expect(err).toMatchObject({ code: 'not-found', message: 'Booking not found.' });
  });

  it('rejects non-pending bookings and missing fares', async () => {
    (fake.db as FakeFirestore).seed('bookings/b1', bookingDoc({ status: 'paid' }));
    const stateErr = callableError(await invoke({ bookingId: 'b1' }, { uid: 'p1' }));
    expect(stateErr.message).toContain('already in state "paid"');

    (fake.db as FakeFirestore).seed('bookings/b1', bookingDoc({ fare: { total: 0 } }));
    expect(callableError(await invoke({ bookingId: 'b1' }, { uid: 'p1' })).message).toBe('Booking has no fare.');
  });

  it('requires the passenger to have an email', async () => {
    (fake.db as FakeFirestore).seed('users/p1', {});
    const res = await invoke({ bookingId: 'b1' }, { uid: 'p1' });
    expect(callableError(res)).toMatchObject({
      code: 'failed-precondition',
      message: 'Add an email to your account before paying.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces paystack network failures as unavailable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNRESET'));
    const res = await invoke({ bookingId: 'b1' }, { uid: 'p1' });
    expect(callableError(res)).toMatchObject({ code: 'unavailable', status: 503 });
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('surfaces paystack rejections as internal without stashing anything', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ status: false, message: 'invalid amount' }),
    } as unknown as Response);
    const res = await invoke({ bookingId: 'b1' }, { uid: 'p1' });
    expect(callableError(res)).toMatchObject({ code: 'internal', message: 'invalid amount' });
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('initializes a transaction and stashes the reference on the booking', async () => {
    const res = await invoke({ bookingId: 'b1' }, { uid: 'p1' });
    expect(res.status).toBe(200);
    expect((res.body as { result?: unknown }).result).toEqual({
      authorizationUrl: 'https://paystack/checkout/abc',
      accessCode: 'ac_1',
      reference: 'yb_b1_1',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.paystack.co/transaction/initialize');
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: `Bearer ${SECRET}`,
      'Content-Type': 'application/json',
    });
    const sent = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
    expect(sent).toMatchObject({
      email: 'p1@yb.com',
      amount: 100_000,
      currency: 'NGN',
      reference: expect.stringMatching(/^yb_b1_\d+$/),
      metadata: { bookingId: 'b1' },
    });

    const db = fake.db as FakeFirestore;
    const booking = await db.doc('bookings/b1').get();
    expect(booking.data()).toMatchObject({ paystackReference: 'yb_b1_1' });
    expect(typeof (booking.data() as { paystackInitializedAt?: unknown }).paystackInitializedAt).toBe('number');
  });

  it('passes explicit channels through to paystack', async () => {
    await invoke({ bookingId: 'b1', channels: ['card'] }, { uid: 'p1' });
    const sent = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string) as Record<string, unknown>;
    expect(sent.channels).toEqual(['card']);
  });
});
