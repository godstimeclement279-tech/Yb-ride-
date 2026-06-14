# Paystack Production Cutover

The code today (Stage 4a) uses the **test** public key directly in the passenger client, with `inline.js` opening Paystack's checkout in a WebView. That's fine for testing — but **unsafe for production** because it trusts a client-side `onSuccess` callback to mark bookings paid, which a malicious user could fake.

This doc walks through the **Stage 4b production migration**: server-side transaction initialization, signed webhook verification, and the live-key swap.

The Cloud Function code is already written:
- `firebase/functions/src/initializePaystackTransaction.ts` — callable. Initializes the transaction server-side with your secret key, returns the hosted-checkout URL to the client.
- `firebase/functions/src/paystackWebhook.ts` — HTTPS endpoint. Verifies HMAC signature on every Paystack event, flips the booking to `paid` on `charge.success`. Idempotent + amount-mismatch guard included.

What's left is **deployment + client wiring + key swap**. Five phases, do them in this order.

---

## Phase 1 — Paystack dashboard prep

1. https://dashboard.paystack.com — sign in to your YB Ride business account.
2. Settings → API Keys & Webhooks. Note both the **Test** and **Live** secret keys.
3. **Complete business verification (KYC)**. Until this is done, Paystack will hold any settled funds. Submit CAC documents, director ID, proof of address, business bank account.
4. Settings → Payment Channels. Enable: Card, Bank Transfer, USSD (optional).
5. Leave the webhook URL blank for now — you'll fill it in Phase 3.

---

## Phase 2 — Deploy the Cloud Functions

Storage prerequisite: your Firebase project must be on the **Blaze (pay-as-you-go) plan**. Free Spark plan can't deploy v2 HTTP functions. Upgrade in Firebase Console → Usage and billing.

```
cd firebase/functions
npm install   # if you haven't yet
```

Set the secret (paste the **TEST** secret key first; swap to LIVE in Phase 5):

```
firebase functions:secrets:set PAYSTACK_SECRET
# Paste sk_test_... when prompted
```

Deploy:

```
firebase deploy --only functions:initializePaystackTransaction,functions:paystackWebhook
```

After deploy, get the URLs:

```
firebase functions:list
```

Note the URL of `paystackWebhook` — looks like `https://europe-west1-yb-ride-fe206.cloudfunctions.net/paystackWebhook`.

Then ensure public invoker (Cloud Run rejects every call at the edge without this — see [[yb-ride-callable-invoker]] memory):

```
gcloud run services add-iam-policy-binding initializepaystacktransaction \
  --region=europe-west1 --member=allUsers --role=roles/run.invoker \
  --project=yb-ride-fe206

gcloud run services add-iam-policy-binding paystackwebhook \
  --region=europe-west1 --member=allUsers --role=roles/run.invoker \
  --project=yb-ride-fe206
```

(The webhook MUST be publicly invokable so Paystack's servers can POST to it; the HMAC verification inside the function is what makes that safe.)

---

## Phase 3 — Wire the webhook in the Paystack dashboard

1. Paystack dashboard → Settings → API Keys & Webhooks.
2. **Webhook URL** field: paste the `paystackWebhook` URL from Phase 2.
3. **Test** the webhook from the dashboard's "Send test event" button. The Cloud Function logs (`firebase functions:log`) should show:
   ```
   paystackWebhook event { type: 'charge.success', ref: '...' }
   ```
4. Confirm the test event got a `200 OK`. If `401 invalid signature` — the secret you set in Phase 2 doesn't match the dashboard account. Re-check.

---

## Phase 4 — Migrate the passenger client

The current client (`apps/passenger-new/src/components/PaystackCheckout.tsx` + `services/paystack.ts`) builds an HTML page that boots `inline.js` with the public key. That stays working for test mode. For production, swap to the **hosted-checkout-URL** flow.

### 4a — New client service

Replace the body of `PaymentScreen.onPayNow` to call the Cloud Function and use the returned URL:

```ts
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { getFbApp } from '../services/firebase/index';

// inside PaymentScreen:
const onPayNow = async () => {
  if (!user?.email) { /* unchanged email check */ return; }
  setPaying(true);
  try {
    const functions = getFunctions(getFbApp(), 'europe-west1');
    const init = httpsCallable<{ bookingId: string }, { authorizationUrl: string }>(
      functions,
      'initializePaystackTransaction',
    );
    const res = await init({ bookingId: booking.id });
    setCheckoutOpen(true);
    setCheckoutUrl(res.data.authorizationUrl);  // new state
  } catch (err) {
    Alert.alert('Payment setup failed', (err as Error).message);
  } finally {
    setPaying(false);
  }
};
```

### 4b — PaystackCheckout simplification

The WebView now just loads the hosted URL directly:

```tsx
<WebView
  source={{ uri: checkoutUrl }}
  onNavigationStateChange={(nav) => {
    // Paystack redirects to a "thanks" page after payment with the
    // reference in the URL. Don't trust this for marking paid (the
    // webhook does that) — but use it as a UX signal to close the modal
    // and start polling Firestore for the status flip.
    if (nav.url.includes('paystack.com/close') || nav.url.includes('/paystack/return')) {
      onClose();
      onResult({ type: 'success_pending' });  // new result type
    }
  }}
/>
```

After modal close, the booking status is **not yet `paid`** — the webhook may take 1-5 seconds. Show a "Confirming payment…" overlay while you wait for the Firestore subscription to flip `status` to `paid`, then navigate to TripTracking.

### 4c — Remove inline.js HTML generation

The `buildPaystackCheckoutHtml` function in `services/paystack.ts` is no longer needed. Delete it once the new flow is live, OR keep it behind a `__DEV__` flag if you want test mode to keep using the old approach.

---

## Phase 5 — Swap the keys

This is the actual "go live" moment.

1. Paystack dashboard → API Keys & Webhooks → Live tab → copy `sk_live_…` secret key.
2. Update the Cloud Function secret:
   ```
   firebase functions:secrets:set PAYSTACK_SECRET
   # Paste sk_live_... when prompted
   firebase deploy --only functions:initializePaystackTransaction,functions:paystackWebhook
   ```
   (Functions automatically pick up the new secret value on the next invocation; redeploy isn't strictly required but ensures clean state.)
3. There's NO public live key swap needed if you're on the new flow (Phase 4) — the client only knows your Cloud Function URL, not a Paystack key.

If you're still on the old client flow (inline.js + public key), also update `services/paystack.ts`:
```ts
export const PAYSTACK_PUBLIC_KEY = 'pk_live_...';
```
But strongly prefer Phase 4 first.

---

## Verification

After the cutover:

- [ ] Run a real transaction with a real card for ₦100 (your own card). It clears via card or bank transfer.
- [ ] Within ~5s of payment, the Cloud Function logs show `paystackWebhook event { type: 'charge.success' }`.
- [ ] The booking flips to `status: 'paid'` in Firestore.
- [ ] The passenger app navigates to TripTracking.
- [ ] Refund the test transaction from Paystack dashboard. Confirm webhook `charge.success` is NOT re-fired (Paystack only sends success events once per charge).
- [ ] Try the same in production with a colleague booking and you driving. Real end-to-end.

## Security notes

- **The webhook is publicly invokable on Cloud Run, but anyone POSTing to it must include a valid HMAC signature computed with your secret key.** Without the secret, no attacker can craft a valid `charge.success` and forge a paid booking.
- **The initialize callable requires a Firebase Auth token.** Only the passenger who owns the booking can initialize payment for it (`booking.passengerId === auth.uid` check).
- **Never log the secret key.** Cloud Function logs are visible to anyone with Firebase Console access; even comma-stringification of secrets has bitten teams.
- **Rotate the secret quarterly** in production. Set a calendar reminder. `firebase functions:secrets:set PAYSTACK_SECRET` followed by a redeploy.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `initializePaystackTransaction` returns `internal` from the client | Cloud Run `allUsers` invoker binding missing on the function. Re-run the `gcloud run services add-iam-policy-binding` from Phase 2. |
| Webhook returns 401 `invalid signature` | Secret mismatch. Dashboard sk_live_ key ≠ what you set in `functions:secrets:set`. Reset both to the same value. |
| Booking never flips to `paid` even though Paystack shows success | Webhook firing but Firestore update failing (rules?). Check `firebase functions:log paystackWebhook` for `firestore error`. |
| `failed-precondition: Booking is already in state "paid"` | Idempotency — user tapped Pay twice. Fine. Show success. |
| Paystack init returns "Customer email is required" | The user's Firestore `/users/{uid}.email` field is empty. Force users to set one in the signup flow or before payment. |

## Cost notes (Blaze plan)

- Cloud Functions: free tier covers 2M invocations + 400k GB-seconds per month. A single transaction round-trip is ~3 invocations (init + webhook + status update via trigger). Comfortably free at MVP scale.
- Firestore writes: ~5 per booking lifecycle. Free tier covers 20k/day.
- Paystack: 1.5% per transaction + ₦100 for transactions ≥ ₦2500. No fixed monthly cost.
