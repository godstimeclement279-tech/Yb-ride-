// Paystack runtime config (passenger app).
//
// Stage 4a: client-side initialization with the TEST public key. Paystack
// renders its checkout in a WebView; on success it postMessages back to
// React Native which marks the booking as paid in Firestore.
//
// Stage 4b (later, requires Firebase Blaze): replace this with a Cloud
// Function that calls /transaction/initialize server-side and a webhook
// that flips the booking status — that path verifies payments rather than
// trusting a client-side callback.

export const PAYSTACK_PUBLIC_KEY =
  'pk_test_b419ac763b80dd7a2bf47503ce18031573e7e557';

// Live keys must NEVER ship in client code. When we go to production we
// swap to a Cloud Function and keep the secret key server-side only.
export const PAYSTACK_TEST_MODE = PAYSTACK_PUBLIC_KEY.startsWith('pk_test_');

export interface PaystackCheckoutArgs {
  // Customer email — Paystack requires it on every transaction.
  email: string;
  // Amount in NGN kobo (integer).
  amountKobo: number;
  // Booking ID we want echoed back in metadata so the success callback
  // can flip the right Firestore doc.
  bookingId: string;
  // Restrict to bank transfer (MVP). Future: add 'card' once accepted.
  channels?: Array<'card' | 'bank_transfer' | 'ussd' | 'qr' | 'mobile_money'>;
}

/**
 * Build the HTML page that Paystack's inline JS will boot from inside the
 * WebView. The page boots PaystackPop and triggers `newTransaction()` on
 * load. On success / cancel it posts a JSON message back to the RN host.
 *
 * Keep this lean — the WebView script must be self-contained because Expo
 * Go doesn't expose React Native modules to the page itself.
 */
export function buildPaystackCheckoutHtml(args: PaystackCheckoutArgs): string {
  const channels = args.channels ?? ['bank_transfer'];
  const ref = `yb_${args.bookingId}_${Date.now()}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>YB Ride — secure payment</title>
<script src="https://js.paystack.co/v2/inline.js"></script>
<style>
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: #F5F5F7;
    color: #0A0A0A;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .loader {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 12px;
    text-align: center;
    padding: 0 24px;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid #E5E7EB;
    border-top-color: #1E3A8A;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="loader">
  <div class="spinner"></div>
  <div>Loading Paystack…</div>
</div>
<script>
  function send(payload) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  }
  try {
    var popup = new PaystackPop();
    popup.newTransaction({
      key: '${PAYSTACK_PUBLIC_KEY}',
      email: ${JSON.stringify(args.email)},
      amount: ${args.amountKobo},
      currency: 'NGN',
      ref: ${JSON.stringify(ref)},
      channels: ${JSON.stringify(channels)},
      metadata: {
        bookingId: ${JSON.stringify(args.bookingId)},
      },
      onSuccess: function (tx) {
        send({ type: 'success', reference: tx.reference || ${JSON.stringify(ref)} });
      },
      onCancel: function () {
        send({ type: 'cancel' });
      },
      onError: function (err) {
        send({ type: 'error', message: (err && err.message) || 'Payment error' });
      },
    });
  } catch (e) {
    send({ type: 'error', message: (e && e.message) || 'Paystack failed to load' });
  }
</script>
</body>
</html>`;
}

export interface PaystackResult {
  type: 'success' | 'cancel' | 'error';
  reference?: string;
  message?: string;
}

export function parsePaystackMessage(raw: string): PaystackResult | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PaystackResult>;
    if (
      !parsed ||
      (parsed.type !== 'success' &&
        parsed.type !== 'cancel' &&
        parsed.type !== 'error')
    ) {
      return null;
    }
    return parsed as PaystackResult;
  } catch {
    return null;
  }
}
