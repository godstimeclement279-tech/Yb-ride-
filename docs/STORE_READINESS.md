# YB Ride — App Store + Play Store Readiness Checklist

What we need to satisfy Apple App Store + Google Play Store reviewers, plus the YB-Ride-specific pre-launch tasks. Updated 2026-06.

References:
- Apple App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store Developer Policy Center: https://support.google.com/googleplay/android-developer/topic/9858052

---

## A. Hard prerequisites (do these first; some take days)

### A.1 Apple Developer Program
- [ ] Enrol at https://developer.apple.com/programs/ ($99/year).
- [ ] Apple's verification can take **24-48h** for individual accounts, **up to 2 weeks** for org accounts. Start NOW.
- [ ] After enrolment: create an App ID (`com.ybride.passenger`, `com.ybride.driver`) in Certificates, Identifiers & Profiles.
- [ ] Generate distribution certificate + provisioning profile (EAS can do this automatically).

### A.2 Google Play Developer account
- [ ] One-time $25 at https://play.google.com/console/signup
- [ ] Verification ~24h.
- [ ] Create app entries for passenger + driver.

### A.3 Apple App Store Connect
- [ ] Create app entries for passenger (`com.ybride.passenger`) + driver (`com.ybride.driver`).
- [ ] Apple-specific: confirm tax forms + banking info BEFORE you can publish (paid distribution); free apps still need them.

### A.4 Bundle identifiers + signing
- [ ] Passenger: `com.ybride.passenger` (matches `app.config.js`).
- [ ] Driver: `com.ybride.driver` (matches `app.config.js`).
- [ ] Android keystore: managed by EAS (already in use); verify it's the production keystore, not a dev one.
- [ ] iOS signing: provisioning profile + distribution cert managed by EAS.
- [ ] Save the keystore SHA-1 + SHA-256 for Google Play (used for App Signing by Google Play).

---

## B. Apple App Store specific (most rejection risk lives here)

### B.1 Guideline 4.0 — Design
- [ ] App must use **standard UI patterns**, not look like a website wrapper.
- [ ] No "Coming soon" buttons that don't do anything (rejected under 2.1 if found).
- [ ] No crash on launch on the iPhone Apple uses for review (typically an older model — iPhone 11/SE-class).

### B.2 Guideline 5.1.1 — Privacy
- [ ] **Privacy policy URL** — required. Live page accessible without login. Yb-ride.com/privacy or similar.
- [ ] **Data collection disclosure** in App Store Connect → Privacy Nutrition Label. List exactly: email, phone, location (precise + coarse), payment info (handled by Paystack), trip history, push token.
- [ ] App tracks user across other companies' apps? NO. (We don't use ad SDKs.)
- [ ] Account deletion: **Apple now requires** an in-app account deletion flow (Guideline 5.1.1(v)). Add to passenger Settings: "Delete Account" → confirms → calls `deleteAccount` Cloud Function → wipes Auth + Firestore doc + sign out.

### B.3 Guideline 4.8 — Sign in with Apple
- [ ] If passenger app shows **any** third-party social sign-in (Google, Facebook), Apple requires Sign in with Apple too.
- [ ] Implementation: `expo-apple-authentication` + Firebase Apple provider + Apple Services ID + Sign in with Apple key (.p8) uploaded to Firebase.
- [ ] OR remove all social buttons for v1 and ship email+password only — sidesteps the requirement.

### B.4 Guideline 1.5 — Safety / Contact info
- [ ] Visible in-app: support email + phone number (we have these on Profile → Help Center; confirm they work).
- [ ] App's marketing page (app.ybride.com) must list a real contact.

### B.5 Guideline 5.4 — Location services
- [ ] Use-case must be clear in the permission prompt copy. Passenger app already has `NSLocationWhenInUseUsageDescription` — verify the wording explains "to set your pickup and show drivers nearby."
- [ ] Driver app has all 3 (`WhenInUse`, `AlwaysAndWhenInUse`, `Always`) — verify the "Always" copy is honest about background tracking.
- [ ] Background location: confirm `UIBackgroundModes: ['location', 'fetch']` in `app.config.js`.
- [ ] If we ship a "Live Activity" or "Dynamic Island" feature later → separate review.

### B.6 Guideline 3.1.1 — Payments
- [ ] All in-app digital content sold via In-App Purchase only.
- [ ] **Ride bookings are a real-world service**, not digital content — Paystack is FINE under Guideline 3.1.5(a).
- [ ] Do NOT mention "buy / unlock / premium subscription" anywhere in app copy unless we ship IAP.

### B.7 Guideline 2.5.10 — TestFlight
- [ ] Add at least one external tester email (a real Apple ID) before submitting to App Store.
- [ ] TestFlight build for review needs valid encryption export compliance answer: **"No"** for now (we use HTTPS only, no custom crypto).

### B.8 App Store Connect metadata
- [ ] App name: "YB Ride" / "YB Ride Driver" (≤ 30 chars).
- [ ] Subtitle: "Movement made easy" (≤ 30 chars).
- [ ] Promotional text: 170 chars max (editable post-launch).
- [ ] Description: 4000 chars max.
- [ ] Keywords: 100 chars, comma-separated. Suggest: `taxi,ride,agbor,delta,nigeria,paystack,bolt,uber`.
- [ ] Support URL: live page.
- [ ] Marketing URL: live page (optional but recommended).
- [ ] **Screenshots**: required sizes per device:
  - 6.7" iPhone (Pro Max): 1290×2796 — required.
  - 6.5" iPhone: 1242×2688 OR 1284×2778 — required.
  - 5.5" iPhone (legacy): 1242×2208 — required.
  - iPad Pro 12.9" (3rd gen+): 2048×2732 — only if supporting iPad (we're phone-only, mark supportsTablet:false).
  - 3-10 screenshots per size, no device frames in the screenshots themselves.
- [ ] App icon: 1024×1024 PNG, no alpha, no rounded corners (Apple rounds them automatically).
- [ ] Age rating: 4+ likely (no objectionable content) — answer the survey accurately.

---

## C. Google Play Store specific

### C.1 Data safety form (analogous to Apple's privacy label)
- [ ] Fill out the Data Safety section in Play Console.
- [ ] Declare collection: email, name, phone, precise + approximate location, photos (if profile pic added later), purchase history, app activity, app interaction.
- [ ] Declare sharing: with payment processor (Paystack), Firebase (Google).
- [ ] Encrypted in transit: YES.
- [ ] User can request deletion: YES (via in-app + email).

### C.2 Background location justification
- [ ] Driver app uses `ACCESS_BACKGROUND_LOCATION` → Play Store requires a separate justification + video walkthrough showing the foreground service notification + the user benefit.
- [ ] Be prepared to upload a 30-60s screen recording demonstrating the feature.

### C.3 Sensitive permissions
- [ ] `FOREGROUND_SERVICE_LOCATION` (Android 14+) — must declare in Play Console.
- [ ] No SMS / Call Log permissions (we don't need these).

### C.4 Target API level
- [ ] Play Store requires `targetSdkVersion = 34` (Android 14) for new submissions as of Aug 2024. Expo SDK 54 builds satisfy this automatically.
- [ ] Verify in built APK: `aapt dump badging app.apk | grep targetSdkVersion`.

### C.5 Listing assets
- [ ] App icon: 512×512 PNG, 32-bit, transparency NOT required (we use the yellow brand square).
- [ ] Feature graphic: 1024×500 JPG or 24-bit PNG.
- [ ] Screenshots: phone 16:9 or 9:16, 320-3840px on each edge, 2-8 screenshots.
- [ ] Short description: 80 chars.
- [ ] Full description: 4000 chars.
- [ ] App category: Travel & Local.
- [ ] Content rating: complete the IARC questionnaire.

### C.6 Play Integrity / App Signing
- [ ] Enrol in Play App Signing (Play holds the upload key, we hold a release key).
- [ ] EAS Build handles this; verify post-upload.

### C.7 Account deletion (Play now requires it too)
- [ ] In-app deletion flow + a web-based deletion request URL listed in the Play listing.
- [ ] Email-only deletion is NOT enough — must have a non-login web form too.

---

## D. YB Ride-specific pre-launch

### D.1 Production environment cutover
- [ ] Paystack: swap `pk_test_…` → `pk_live_…` in `services/paystack.ts`.
- [ ] **CRITICAL**: deploy the server-side Cloud Function + webhook (Stage 4b per PRD) before swapping. Client-side trust on a live key = fraud risk.
  - `initializePaystackTransaction` (callable) — creates the transaction server-side.
  - `paystackWebhook` (HTTP) — receives the success event from Paystack, verifies signature, marks booking `paid`.
- [ ] Paystack KYC complete (Paystack will hold funds until business verification done).

### D.2 Firestore production indices
- [ ] Composite index for `carTypes` query: `isActive ASC, sortOrder ASC, __name__ ASC` — auto-creation URL printed in Metro logs when the query first runs; click it once and Firebase builds the index in ~5 min.
- [ ] Composite indices for any other queries that combine `where` + `orderBy`. Check Firebase Console → Indexes → "Auto-generated" suggestions.
- [ ] Firestore security rules: review for production. Default `allow read, write: if request.auth != null;` is too loose. Need per-role rules.

### D.3 Cloud Run IAM
- [ ] `createstaffaccount` + `deleteaccount` have `allUsers → Cloud Run Invoker` (already done; verify it persists across re-deploys).
- [ ] `initializePaystackTransaction` + `paystackWebhook` will need the same when deployed.

### D.4 Map keys + restrictions
- [ ] Google Maps API key restrictions for production:
  - Application restriction = **None** (HTTP fetch from RN + native SDK both need to work — see early-session memory).
  - API restrictions = Places API (New) + Geocoding API + Maps SDK for Android + **Maps SDK for iOS**.
  - **Enable Maps SDK for iOS** (we currently only enabled Android).
- [ ] Mapbox public token is fine (still used for tile rendering in some places + driving directions); keep as-is.

### D.5 FCM push notifications
- [ ] Configure FCM in Firebase Console → Project Settings → Cloud Messaging.
- [ ] Upload `google-services.json` to EAS for Android.
- [ ] Upload APNs key (.p8) to Firebase for iOS (requires Apple Developer enrolment).
- [ ] Test push to a real device works for trip-related + promo notifications.
- [ ] Custom sound asset(s) for "new trip" alert on driver app.

### D.6 App icons + splash
- [ ] Confirm all 4 apps have proper 1024×1024 (iOS) + 512×512 (Android) icons in `apps/*/assets/`.
- [ ] Splash: yellow `#FACC15` background + logo, 1242×2436 (iOS) + adaptive icon (Android).
- [ ] No "DEV" badge on production icons.

### D.7 Crash + analytics
- [ ] Sentry or Firebase Crashlytics integrated; sourcemaps uploaded per EAS build.
- [ ] Firebase Analytics events for: signup, trip booked, trip paid, trip completed, trip cancelled.
- [ ] Verify in DebugView during testing.

### D.8 Legal pages
- [ ] Terms of Service — live URL.
- [ ] Privacy Policy — live URL (linked from app + store listings).
- [ ] Accessibility statement — live URL.
- [ ] Refund / Cancellation policy — live URL.
- [ ] Driver Agreement (separate from passenger ToS) — live URL.

### D.9 Support channels
- [ ] Support email monitored daily.
- [ ] Support phone monitored business hours.
- [ ] Customer-facing helpdesk URL (or just an email form).

---

## E. Submission day

### E.1 Pre-submission checklist (run 24h before)
- [ ] All test plans passed (TEST_PASSENGER.md, TEST_DRIVER.md, TEST_STAFF.md, TEST_ADMIN.md).
- [ ] No `console.log` / debug overlays / Skip-login button in production build.
- [ ] Build with `eas build --profile production` (NOT preview) for both apps.
- [ ] Test the production build on a real device one final time.
- [ ] All store metadata + screenshots uploaded.
- [ ] Privacy + Terms URLs return 200, not 404.

### E.2 Submission
- [ ] Apple: `eas submit -p ios` → goes to App Store Connect → manual submit for review.
- [ ] Apple review typically takes 24-48h. First submissions sometimes take longer.
- [ ] Google: `eas submit -p android` → goes to Play Console → publish to internal testing first; promote after smoke test.
- [ ] Play review typically takes 24-72h for new apps.

### E.3 What to do on rejection
- [ ] READ the rejection notice carefully — Apple includes a specific guideline number.
- [ ] Reply in Resolution Center within the app review portal (not email).
- [ ] If genuinely confused → request a 30-minute call with a reviewer (Apple offers this for new developers).
- [ ] Address the issue, bump build number, resubmit.

---

## F. Post-launch (week 1)

- [ ] Watch Crashlytics for production crashes daily.
- [ ] Track app store ratings; respond to all 1-2 star reviews within 24h.
- [ ] Monitor Cloud Function quotas + Firestore reads — first week often surfaces N+1 query problems.
- [ ] Schedule a small "v1.0.1" release within 2 weeks to fix the inevitable launch-day bugs (this should be planned, not reactive).
