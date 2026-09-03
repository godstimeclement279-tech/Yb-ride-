import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import crypto from 'node:crypto';

// ─── paystackWebhook ────────────────────────────────────────────────────────
//
// Paystack POSTs every transaction event to this URL. We verify the HMAC
// signature using the SECRET KEY (stored as a Cloud Function secret), then
// flip the matching booking's status to 'paid' for charge.success events.
//
// To configure:
//   firebase functions:secrets:set PAYSTACK_SECRET
//
// To find the URL after deploy:
//   firebase functions:list
//   Look for the paystackWebhook URL and paste it into the Paystack dashboard
//   under Settings → API Keys & Webhooks → Webhook URL.

const PAYSTACK_SECRET = defineSecret('PAYSTACK_SECRET');

interface PaystackEvent {
  event: string;
  data: {
    id?: number;
    reference?: string;
    amount?: number; // in kobo
    status?: string;
    currency?: string;
    metadata?: { bookingId?: string } | string | null;
  };
}

// Kept as a pure function so the money gate is testable; the comparison
// itself is unchanged from the original handler.
export function verifyPaystackSignature(
  signature: string,
  rawBody: Buffer,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  return signature === expected;
}

export function parseMetadataBookingId(
  meta: PaystackEvent['data']['metadata'],
): string | null {
  if (!meta) return null;
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta) as { bookingId?: string };
      return parsed.bookingId ?? null;
    } catch {
      return null;
    }
  }
  return meta.bookingId ?? null;
}

// Decide whether a charge.success should flip this booking to paid. Returns
// the Firestore update payload, or null when the event must be ignored
// (already paid, or the settled amount is below the fare).
export function flipBookingUpdates(
  data: unknown,
  paidKobo: number,
  paystackReference: string | null,
): Record<string, unknown> | null {
  const booking = (data ?? {}) as {
    status?: unknown;
    paidAt?: unknown;
    fare?: { total?: unknown };
  };
  // Idempotent: don't overwrite an already-paid booking.
  if (booking.status === 'paid' || booking.paidAt) return null;

  // Sanity check: Paystack amount (kobo) should match our fare.
  const fareKobo = (booking.fare?.total as number | undefined) ?? 0;
  if (paidKobo > 0 && fareKobo > 0 && paidKobo < fareKobo) return null;

  return {
    status: 'paid',
    paidAt: Date.now(),
    paystackReference: paystackReference ?? null,
    paymentMethod: 'bank_transfer',
  };
}

export const paystackWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [PAYSTACK_SECRET],
    cors: false,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('method not allowed');
      return;
    }

    // Verify HMAC-SHA512 of the raw body against the x-paystack-signature header.
    const signature = req.header('x-paystack-signature') ?? '';
    const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      logger.warn('paystackWebhook: missing rawBody');
      res.status(400).send('missing body');
      return;
    }
    if (!verifyPaystackSignature(signature, rawBody, PAYSTACK_SECRET.value())) {
      logger.warn('paystackWebhook: invalid signature');
      res.status(401).send('invalid signature');
      return;
    }

    const event = req.body as PaystackEvent;
    logger.info('paystackWebhook event', { type: event.event, ref: event.data?.reference });

    // We only act on successful charges. Everything else is logged and ack'd.
    if (event.event !== 'charge.success' || event.data.status !== 'success') {
      res.status(200).send('ignored');
      return;
    }

    const bookingId = parseMetadataBookingId(event.data.metadata);
    if (!bookingId) {
      logger.warn('paystackWebhook: charge.success without bookingId metadata');
      res.status(200).send('no booking');
      return;
    }

    const db = getFirestore();
    const ref = db.doc(`bookings/${bookingId}`);
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) {
          logger.warn('paystackWebhook: booking not found', { bookingId });
          return;
        }
        const updates = flipBookingUpdates(
          snap.data(),
          event.data.amount ?? 0,
          event.data.reference ?? null,
        );
        if (!updates) return;
        tx.update(ref, updates);
      });
      res.status(200).send('ok');
    } catch (err) {
      logger.error('paystackWebhook firestore error', err);
      res.status(500).send('internal');
    }
  },
);
