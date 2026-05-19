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

function parseMetadataBookingId(meta: PaystackEvent['data']['metadata']): string | null {
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
    const expected = crypto
      .createHmac('sha512', PAYSTACK_SECRET.value())
      .update(rawBody)
      .digest('hex');
    if (signature !== expected) {
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
        const data = snap.data();
        // Idempotent: don't overwrite an already-paid booking.
        if (data?.status === 'paid' || data?.paidAt) return;

        // Sanity check: Paystack amount (kobo) should match our fare.
        const paidKobo = event.data.amount ?? 0;
        const fareKobo = (data?.fare?.total as number | undefined) ?? 0;
        if (paidKobo > 0 && fareKobo > 0 && paidKobo < fareKobo) {
          logger.warn('paystackWebhook: amount mismatch — refusing to flip', {
            bookingId,
            paidKobo,
            fareKobo,
          });
          return;
        }

        tx.update(ref, {
          status: 'paid',
          paidAt: Date.now(),
          paystackReference: event.data.reference ?? null,
          paymentMethod: 'bank_transfer',
        });
      });
      res.status(200).send('ok');
    } catch (err) {
      logger.error('paystackWebhook firestore error', err);
      res.status(500).send('internal');
    }
  },
);
