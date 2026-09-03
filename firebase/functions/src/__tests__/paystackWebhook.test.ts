import { describe, expect, it, beforeEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { FakeFirestore, invokeHttp } from './helpers/http';

const { fake } = vi.hoisted(() => ({ fake: { db: null as unknown } }));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => fake.db,
  FieldValue: { serverTimestamp: () => ({}), increment: () => ({}) },
}));

import {
  paystackWebhook,
  verifyPaystackSignature,
  parseMetadataBookingId,
  flipBookingUpdates,
} from '../paystackWebhook';

const SECRET = 'test-paystack-secret';

function sign(rawBody: Buffer): string {
  return crypto.createHmac('sha512', SECRET).update(rawBody).digest('hex');
}

interface EventData {
  amount?: number;
  reference?: string;
  status?: string;
  currency?: string;
  metadata?: { bookingId?: string } | string | null;
}

function eventOf(event: string, data: EventData = {}): unknown {
  return { event, data };
}

async function postWebhook(
  event: unknown,
  opts: { signature?: string; rawBody?: Buffer; method?: string; headers?: Record<string, string> } = {},
) {
  const rawBody = opts.rawBody ?? Buffer.from(JSON.stringify(event));
  const signature = opts.signature ?? sign(rawBody);
  return invokeHttp(paystackWebhook as (req: unknown, res: unknown) => unknown, {
    method: opts.method ?? 'POST',
    headers: { 'x-paystack-signature': signature, ...opts.headers },
    body: event,
    rawBody,
  });
}

const PENDING_BOOKING = { status: 'pending_payment', fare: { total: 100_000 } };

describe('verifyPaystackSignature', () => {
  it('accepts a valid HMAC-SHA512 signature', () => {
    const body = Buffer.from('{"event":"charge.success"}');
    expect(verifyPaystackSignature(sign(body), body, SECRET)).toBe(true);
  });

  it('rejects when the body was tampered with', () => {
    const body = Buffer.from('{"event":"charge.success"}');
    const tampered = Buffer.from('{"event":"charge.failed"}');
    expect(verifyPaystackSignature(sign(body), tampered, SECRET)).toBe(false);
  });

  it('rejects with a wrong secret or empty signature', () => {
    const body = Buffer.from('{"event":"charge.success"}');
    expect(verifyPaystackSignature(sign(body), body, 'wrong-secret')).toBe(false);
    expect(verifyPaystackSignature('', body, SECRET)).toBe(false);
  });
});

describe('parseMetadataBookingId', () => {
  it('reads bookingId from an object or a JSON string', () => {
    expect(parseMetadataBookingId({ bookingId: 'b1' })).toBe('b1');
    expect(parseMetadataBookingId('{"bookingId":"b2"}')).toBe('b2');
  });

  it('returns null for missing, malformed, or non-object metadata', () => {
    expect(parseMetadataBookingId(null)).toBeNull();
    expect(parseMetadataBookingId(undefined)).toBeNull();
    expect(parseMetadataBookingId({})).toBeNull();
    expect(parseMetadataBookingId('not json')).toBeNull();
    expect(parseMetadataBookingId('null')).toBeNull();
    expect(parseMetadataBookingId('[]')).toBeNull();
    expect(parseMetadataBookingId('42')).toBeNull();
    expect(parseMetadataBookingId(JSON.stringify({ other: 1 }))).toBeNull();
  });
});

describe('flipBookingUpdates', () => {
  it('flips a payable booking to paid with reference and method', () => {
    const updates = flipBookingUpdates(PENDING_BOOKING, 100_000, 'ref-1');
    expect(updates).toMatchObject({
      status: 'paid',
      paystackReference: 'ref-1',
      paymentMethod: 'bank_transfer',
    });
    expect(typeof updates?.paidAt).toBe('number');
  });

  it('is idempotent: never overwrites an already-paid booking', () => {
    expect(flipBookingUpdates({ status: 'paid', fare: { total: 100_000 } }, 100_000, 'r')).toBeNull();
    expect(flipBookingUpdates({ status: 'pending_payment', paidAt: 123, fare: { total: 100_000 } }, 100_000, 'r')).toBeNull();
  });

  it('refuses to flip an underpaid charge', () => {
    expect(flipBookingUpdates(PENDING_BOOKING, 99_999, 'ref-under')).toBeNull();
    expect(flipBookingUpdates(PENDING_BOOKING, 1, 'ref-under')).toBeNull();
  });

  it('does not refuse when the fare is unknown (paidKobo or fare is zero)', () => {
    // Mirrors the production guard: the mismatch check only applies when
    // BOTH amounts are known and positive.
    expect(flipBookingUpdates(PENDING_BOOKING, 0, 'r')).not.toBeNull();
    expect(flipBookingUpdates({ status: 'pending_payment', fare: { total: 0 } }, 5_000, 'r')).not.toBeNull();
  });

  it('stores a null reference when Paystack did not send one', () => {
    const updates = flipBookingUpdates(PENDING_BOOKING, 100_000, null);
    expect(updates).toMatchObject({ status: 'paid', paystackReference: null });
  });

  it('handles missing or null data like the original handler (proceeds to flip)', () => {
    expect(flipBookingUpdates(null, 100_000, 'r')).not.toBeNull();
    expect(flipBookingUpdates(undefined, 100_000, 'r')).not.toBeNull();
  });
});

describe('paystackWebhook handler', () => {
  beforeEach(() => {
    fake.db = new FakeFirestore();
  });

  it('rejects non-POST requests with 405', async () => {
    const res = await postWebhook(eventOf('charge.success'), { method: 'GET' });
    expect(res.status).toBe(405);
  });

  it('rejects requests without a raw body with 400', async () => {
    const res = await invokeHttp(paystackWebhook as (req: unknown, res: unknown) => unknown, {
      body: eventOf('charge.success'),
    });
    expect(res.status).toBe(400);
  });

  it('rejects requests with an invalid signature with 401', async () => {
    const event = eventOf('charge.success');
    const res = await postWebhook(event, { signature: 'deadbeef' });
    expect(res.status).toBe(401);
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('acks but ignores non charge.success events', async () => {
    const res = await postWebhook(eventOf('charge.failed', { status: 'failed' }));
    expect(res.status).toBe(200);
    expect(res.body).toBe('ignored');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('acks but ignores charge.success without a success status', async () => {
    const res = await postWebhook(eventOf('charge.success', { status: 'pending' }));
    expect(res.status).toBe(200);
    expect(res.body).toBe('ignored');
  });

  it('acks a charge.success that lacks bookingId metadata without flipping', async () => {
    (fake.db as FakeFirestore).seed('bookings/b1', PENDING_BOOKING);
    const res = await postWebhook(eventOf('charge.success', { status: 'success', metadata: null }));
    expect(res.status).toBe(200);
    expect(res.body).toBe('no booking');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('acks when the booking does not exist', async () => {
    const res = await postWebhook(eventOf('charge.success', { status: 'success', metadata: { bookingId: 'missing' } }));
    expect(res.status).toBe(200);
    expect(res.body).toBe('ok');
    expect((fake.db as FakeFirestore).updates).toHaveLength(0);
  });

  it('flips the matching booking to paid on a valid charge.success', async () => {
    const db = fake.db as FakeFirestore;
    db.seed('bookings/b1', PENDING_BOOKING);
    const raw = Buffer.from(
      JSON.stringify(eventOf('charge.success', {
        amount: 100_000,
        reference: 'ref-1',
        status: 'success',
        metadata: { bookingId: 'b1' },
      })),
    );

    const res = await invokeHttp(paystackWebhook as (req: unknown, res: unknown) => unknown, {
      headers: { 'x-paystack-signature': sign(raw) },
      body: JSON.parse(raw.toString()),
      rawBody: raw,
    });

    expect(res.status).toBe(200);
    expect(res.body).toBe('ok');
    const booking = db.doc('bookings/b1');
    const snap = await booking.get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toMatchObject({
      status: 'paid',
      paystackReference: 'ref-1',
      paymentMethod: 'bank_transfer',
    });
    expect(typeof (snap.data() as { paidAt?: unknown }).paidAt).toBe('number');
    expect(db.updates.filter((u) => u.path === 'bookings/b1')).toHaveLength(1);
  });

  it('leaves an already-paid booking untouched (idempotent)', async () => {
    const db = fake.db as FakeFirestore;
    db.seed('bookings/b1', { status: 'paid', paidAt: 111, paystackReference: 'old', fare: { total: 100_000 } });
    const res = await postWebhook(
      eventOf('charge.success', { status: 'success', metadata: { bookingId: 'b1' }, amount: 100_000, reference: 'ref-2' }),
    );
    expect(res.status).toBe(200);
    expect((await db.doc('bookings/b1').get()).data()).toMatchObject({ paystackReference: 'old' });
    expect(db.updates).toHaveLength(0);
  });

  it('does not flip a booking when the paid amount is below the fare', async () => {
    const db = fake.db as FakeFirestore;
    db.seed('bookings/b1', PENDING_BOOKING);
    const res = await postWebhook(
      eventOf('charge.success', { status: 'success', metadata: { bookingId: 'b1' }, amount: 50_000, reference: 'ref-under' }),
    );
    expect(res.status).toBe(200);
    expect(db.updates).toHaveLength(0);
    expect((await db.doc('bookings/b1').get()).data()).toMatchObject({ status: 'pending_payment' });
  });
});
