import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// ─── initializePaystackTransaction ──────────────────────────────────────────
//
// Stage 4b production callable. The passenger client invokes this to start a
// Paystack transaction SERVER-SIDE instead of trusting client-side
// inline.js + a public key + a self-reported `onSuccess` callback (which a
// motivated user could fake to mark a booking as paid without paying).
//
// Flow:
//   1. Client calls this with { bookingId }.
//   2. We fetch the booking from Firestore, verify the caller owns it, and
//      verify it's in 'pending_payment' status with a non-zero fare.
//   3. We hit Paystack's /transaction/initialize with our SECRET key and the
//      booking's exact amount + a reference we control.
//   4. We return { authorizationUrl, accessCode, reference } to the client.
//   5. Client opens authorizationUrl in the in-app browser. Paystack's
//      hosted checkout handles the actual payment.
//   6. Paystack POSTs the webhook event to paystackWebhook (separate file),
//      which is the SOURCE OF TRUTH for marking the booking paid.
//
// The client's `onSuccess` callback from inline.js is now informational only
// — we never trust it to flip booking status. The webhook does that.
//
// Secret config:
//   firebase functions:secrets:set PAYSTACK_SECRET
//   (paste the sk_live_… key when prompted)

const PAYSTACK_SECRET = defineSecret('PAYSTACK_SECRET');
const PAYSTACK_INIT_URL = 'https://api.paystack.co/transaction/initialize';

interface InitializeData {
  bookingId?: string;
  // Optional channel list — defaults to bank_transfer + card.
  channels?: string[];
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
}

export interface BookingDoc {
  passengerId?: string;
  status?: string;
  fare?: { total?: number };
  pickup?: { label?: string };
  dropoff?: { label?: string };
}

export interface InitializeValidationError {
  code: 'failed-precondition';
  message: string;
}

// Booking-side gate, in the same order the handler evaluates it: status
// first, then a non-zero fare. The email check happens after this in the
// handler because it requires a separate users doc read.
export function validateBookingPayable(
  booking: BookingDoc | undefined,
): InitializeValidationError | null {
  if (booking?.status !== 'pending_payment') {
    return {
      code: 'failed-precondition',
      message: `Booking is already in state "${booking?.status ?? 'undefined'}" — nothing to pay.`,
    };
  }
  const amountKobo = booking.fare?.total ?? 0;
  if (amountKobo <= 0) {
    return { code: 'failed-precondition', message: 'Booking has no fare.' };
  }
  return null;
}

// Compose the Paystack initialize body for a validated booking. The
// reference is OUR id — Paystack echoes it in the webhook, so we can
// correlate without trusting client metadata.
export function buildPaystackInitBody(
  booking: BookingDoc,
  email: string,
  bookingId: string,
  channels: string[] | undefined,
  now: number,
): Record<string, unknown> {
  const effectiveChannels =
    channels && channels.length > 0 ? channels : ['bank_transfer', 'card'];
  return {
    email,
    amount: booking.fare?.total ?? 0,
    currency: 'NGN',
    reference: `yb_${bookingId}_${now}`,
    channels: effectiveChannels,
    // metadata.bookingId is what paystackWebhook reads to flip the booking
    // to paid. Without it, the webhook would have to fall back to
    // matching by reference which is also fine but more brittle.
    metadata: {
      bookingId,
      // Custom fields show up in the Paystack dashboard for support.
      custom_fields: [
        {
          display_name: 'Pickup',
          variable_name: 'pickup',
          value: booking.pickup?.label ?? '',
        },
        {
          display_name: 'Dropoff',
          variable_name: 'dropoff',
          value: booking.dropoff?.label ?? '',
        },
      ],
    },
  };
}

export const initializePaystackTransaction = onCall(
  {
    region: 'europe-west1',
    secrets: [PAYSTACK_SECRET],
    // Keep this short — Paystack's API is fast. If it times out, the user
    // sees an error sooner rather than later.
    timeoutSeconds: 20,
  },
  async (request) => {
    // ── Caller auth ───────────────────────────────────────────────────────
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in to pay for a ride.');
    }
    const uid = request.auth.uid;

    // ── Input validation ──────────────────────────────────────────────────
    const data = (request.data ?? {}) as InitializeData;
    const { bookingId } = data;
    if (!bookingId || typeof bookingId !== 'string') {
      throw new HttpsError('invalid-argument', 'bookingId is required.');
    }

    // ── Fetch booking + ownership check ──────────────────────────────────
    const db = getFirestore();
    const bookingRef = db.doc(`bookings/${bookingId}`);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      throw new HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingSnap.data() as BookingDoc;

    if (booking.passengerId !== uid) {
      // Don't leak whether someone else's booking exists — return same
      // not-found shape.
      throw new HttpsError('not-found', 'Booking not found.');
    }

    const payable = validateBookingPayable(booking);
    if (payable) throw new HttpsError(payable.code, payable.message);

    // ── Fetch passenger email (Paystack requires it) ─────────────────────
    const userSnap = await db.doc(`users/${uid}`).get();
    const email = (userSnap.data() as { email?: string } | undefined)?.email;
    if (!email) {
      throw new HttpsError(
        'failed-precondition',
        'Add an email to your account before paying.',
      );
    }

    // ── Compose Paystack init request ────────────────────────────────────
    const initBody = buildPaystackInitBody(booking, email, bookingId, data.channels, Date.now());

    // ── Hit Paystack ─────────────────────────────────────────────────────
    let response: Response;
    try {
      response = await fetch(PAYSTACK_INIT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initBody),
      });
    } catch (err) {
      logger.error('paystack init: fetch failed', err);
      throw new HttpsError('unavailable', 'Could not reach Paystack. Try again.');
    }

    const json = (await response.json()) as PaystackInitResponse;
    if (!response.ok || !json.status || !json.data?.authorization_url) {
      logger.error('paystack init: bad response', {
        status: response.status,
        body: json,
      });
      throw new HttpsError(
        'internal',
        json.message ?? 'Paystack rejected the transaction.',
      );
    }

    // ── Stash the reference on the booking for audit ──────────────────────
    // Webhook may arrive before the client returns — that's fine; the
    // webhook is the source of truth for the `paid` flip. This update only
    // captures the pending reference for support / forensics.
    await bookingRef.update({
      paystackReference: json.data.reference ?? `yb_${bookingId}_${Date.now()}`,
      paystackInitializedAt: Date.now(),
    });

    return {
      authorizationUrl: json.data.authorization_url,
      accessCode: json.data.access_code ?? null,
      reference: json.data.reference ?? `yb_${bookingId}_${Date.now()}`,
    };
  },
);
