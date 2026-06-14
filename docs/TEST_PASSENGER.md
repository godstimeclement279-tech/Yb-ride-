# YB Ride — Passenger App Test Plan

End-to-end QA checklist for the passenger app before TestFlight / Play Store submission. Run every section on Android first (using the dev client + a clean preview APK), then iOS via TestFlight.

---

## 0. Preconditions

- [ ] Latest **preview** build installed on the device (not just the dev client).
- [ ] A real driver account exists in admin-web with `isActive: true` and a vehicle assigned (so trips can actually be assigned during tracking tests).
- [ ] A real passenger Firebase Auth account exists (email + password) — created via Signup flow or admin.
- [ ] Phone has **internet via a normal Wi-Fi or 4G+** (not hotspot-hosting; see [[project_yb_ride_prd]] notes — RN fetch hangs on phone-as-hotspot setups).
- [ ] Phone has **Location permission** granted to the app.
- [ ] Google Cloud project: Maps SDK for Android + Maps SDK for iOS + Places API (New) + Geocoding API all enabled on the key.
- [ ] Paystack is in TEST mode (`pk_test_…`) — production swap is a separate task.

## 1. App boot + onboarding (cold start)

| # | Test | Expected | Fail criteria |
|---|------|----------|---------------|
| 1.1 | Cold launch (kill app, reopen) | Yellow brand splash fades to logo, holds ~1.8s, routes to Onboarding (first run) or Login (returning user) | Splash flashes white, app crashes, blank screen, hangs > 5s |
| 1.2 | First-run Onboarding | 3 slides swipe horizontally; "Get Started" on last slide → Login | Slides don't swipe, "Get Started" doesn't navigate |
| 1.3 | Returning-user splash | Skips Onboarding; goes to Login (or Home if persisted session) | Re-shows Onboarding even after completion |
| 1.4 | Status bar | Dark icons on yellow splash; theme-appropriate on Home | Wrong icon contrast (white-on-yellow unreadable) |

## 2. Authentication

### 2.1 Sign Up

- [ ] All fields validate (email format, password ≥ 6 chars, phone non-empty).
- [ ] Tap "Sign Up" with empty fields → inline error message.
- [ ] Tap "Sign Up" with valid fields → creates Firebase Auth user + `/users/{uid}` doc with `role: 'passenger'`.
- [ ] After signup, app routes to Home (signed-in state).
- [ ] Re-using an existing email → Firebase error "Email already in use" surfaces clearly.

### 2.2 Login

- [ ] Wrong password → inline "Email or password is wrong."
- [ ] Wrong email → same message (don't reveal whether user exists).
- [ ] Correct credentials → routes to Home; loading spinner shows during the call.
- [ ] On network failure: shows clean "Could not reach the server, check your connection, try again" — NOT the crash overlay (LogBox suppression must work in dev).
- [ ] Retry: after 1st fail, login again succeeds without restarting the app.
- [ ] Auto-retry loop: confirm signIn retries 3× automatically on `auth/network-request-failed` before giving up.

### 2.3 Forgot Password

- [ ] Submit valid email → success message "Check your email…".
- [ ] Submit unregistered email → SAME success message (no leak whether account exists).
- [ ] Email actually arrives in inbox / spam folder (verify on test account).
- [ ] Tapping reset link in email → opens Firebase reset page → new password works on next login.

### 2.4 Sign Out

- [ ] Profile → Sign out → branded ConfirmDialog appears (NOT native Alert).
- [ ] Cancel → returns to Profile, still signed in.
- [ ] Confirm → routes back to Login, session cleared.
- [ ] Re-launching the app after sign-out goes to Login (not auto-signed-in).

### 2.5 Apple Sign In (iOS only, AFTER implementation lands)

- [ ] "Continue with Apple" button visible on iOS Login screen.
- [ ] Tap → native Apple sheet (Face ID / passcode).
- [ ] Successful auth → creates Firebase user with Apple provider; routes to Home.
- [ ] Cancel from Apple sheet → returns to Login without error.
- [ ] On Android: Apple button is HIDDEN (App Store requires it on iOS only; showing on Android is acceptable but not required).

## 3. Home screen

- [ ] **Map renders Google tiles** (street labels visible at default zoom, not blank/gray).
- [ ] Blue user-location dot appears at real GPS position (allow up to 10s for first fix).
- [ ] Top bar: hamburger left, bell right — both tappable (Settings / Notifications).
- [ ] Bottom sheet shows greeting + "Where to?" search bar.
- [ ] Drag bottom sheet handle DOWN → sheet collapses to show map; UP → expands back. Smooth, no shake.
- [ ] Tap "Where to?" → opens LocationSearch in dropoff mode.
- [ ] After selecting a destination, sheet flips to "Select Ride" view with car options.

## 4. Location search (LocationSearch)

- [ ] Top has Pickup + Destination rows (timeline-style); pickup pre-filled with current location.
- [ ] Type "boji boji" → results appear within ~2s (Google Places API).
- [ ] Results show real Agbor places (NOT Abuja or Lagos).
- [ ] Tap a result → sets pickup or dropoff (depending on active field) → returns to Home.
- [ ] "Set on Map" button → MapPicker opens; drag map → pin centred → label updates via reverse-geocode; Confirm sets the location.
- [ ] "Current" button → uses live GPS as pickup (no map needed).
- [ ] Saved Places section shows real saved addresses (empty if none saved — NOT mock Home/Work).
- [ ] Recent section shows recent trip destinations (empty for fresh user).

## 5. Booking flow

### 5.1 Select Ride

- [ ] All 3 car types (Standard / Premium / SUV) shown with car image, FASTEST badge, ETA, price.
- [ ] Tap a car → row gets dark outline, "Confirm <name>" CTA updates.
- [ ] One-way / Round trip pills toggle (round trip ~doubles the fare).
- [ ] Payment row shows "Personal · Paystack" with chevron to PaymentMethods.
- [ ] Promo Applied badge appears in green if a promo is active.
- [ ] Tap "Confirm <name>" → navigates to Fare Breakdown.

### 5.2 Fare Breakdown

- [ ] Pickup + Destination shown with green + pink dots.
- [ ] Car summary card shows correct name + seats + estimated distance + estimated fare.
- [ ] Price Details rows: Base Fare, Distance, Zone Surcharge (if any), Booking Fee, Promo (if applied).
- [ ] Total at bottom matches the sum.
- [ ] "Apply Promo Code" button (if no promo applied) navigates to PromoCodes.
- [ ] "Continue · ₦X" CTA → creates booking in Firestore + navigates to Payment.

### 5.3 Payment

- [ ] Stepper shows: 1 Summary (done), 2 Payment (active), 3 Confirm (pending).
- [ ] Trip summary card shows ride type, distance, base fare, surcharge, total.
- [ ] Tap "Pay ₦X via Paystack" → Paystack iframe opens in the modal.
- [ ] Paystack form loads within ~3s (must not stay on "Loading Paystack…" forever).
- [ ] Use Paystack test card (`4084 0840 8408 4081` / any future date / `408` CVV) → success → booking flips to `paid` → navigates to TripTracking.
- [ ] Cancel inside Paystack → returns to Payment screen, can retry.
- [ ] Network error inside Paystack → "Payment failed" alert with specific reason (not blank).

## 6. Trip Tracking

- [ ] Map shows route polyline from pickup → dropoff.
- [ ] Top floating pill: Pickup | En Route | Drop-off with active indicator.
- [ ] Driver card: avatar, name + rating pill, vehicle make/model + plate, phone + locate icons.
- [ ] "Finding driver…" label until staff assigns a driver from staff-web.
- [ ] After admin/staff assigns driver: driver info populates within ~5s (Firestore subscribe).
- [ ] Driver moves on map as their app sends GPS pings (~5s interval).
- [ ] ETA updates every ~30s from Mapbox/Google Directions.
- [ ] Tap phone icon → opens dialer with driver's number (if available).
- [ ] Tap locate icon → re-centres map on driver.
- [ ] Tap "Safety Toolkit" → currently a placeholder Alert; just verify it doesn't crash.
- [ ] "Cancel Trip" → confirm dialog → cancels booking (status `cancelled`) → returns to Home.
- [ ] When driver app marks trip `completed`: passenger app shows "Rate Your Trip" CTA → Rating.

## 7. Rating

- [ ] 5-star tap targets work; selected star count visible.
- [ ] Optional comment field accepts up to ~280 chars.
- [ ] Submit → writes to Firestore `/ratings/{bookingId}` → returns to Home.
- [ ] Skip (no rating submitted) is allowed → returns to Home.

## 8. History + Receipt

- [ ] Trips tab → History list shows the just-completed trip at the top.
- [ ] Grouped by Recent / Previous Month / older periods.
- [ ] Each row: date pill, COMPLETED green status, fare, pickup + dropoff with timeline dots, car type icon + "View Receipt".
- [ ] Filter chips: All / Business / Personal / Scheduled — verify counts change.
- [ ] Tap "View Receipt" → opens Receipt with map preview + driver block + timeline + fare breakdown + payment method line.
- [ ] Share icon (top right) → opens system share sheet with trip summary text.

## 9. Profile

- [ ] Avatar with online dot, name, phone, VERIFIED USER badge.
- [ ] ACCOUNT section: Saved Addresses, Payment Methods, Promo Codes — each navigates correctly.
- [ ] PREFERENCES: Ride History (jumps to Trips tab), Notifications, Privacy & Security.
- [ ] SUPPORT: Help Center, Legal.
- [ ] Sign out → branded ConfirmDialog (already covered in §2.4).

## 10. Saved Addresses

- [ ] "Add New Address" tile at top → AddAddress screen.
- [ ] Empty state when no addresses (no fake Home/Work mock — should be blank or empty illustration).
- [ ] Add a Favorite (type: Home / Work) → row appears under Favorites.
- [ ] Add an Other Saved Location (type: other, custom name) → appears under "Other Saved Locations".
- [ ] Tap a row → opens Edit / Delete modal.
- [ ] Delete confirms and removes from list + Firestore.

## 11. Promo Codes

- [ ] Input + Apply button.
- [ ] Enter a known valid code (e.g. `WELCOME50`) → "Applied!" toast + green badge.
- [ ] Enter an invalid code → "Code not recognised" inline error.
- [ ] Enter an expired code → "Code is expired."
- [ ] Available Offers list shows live promos from Firestore with end dates.
- [ ] Tap an offer card → auto-fills the code into the input.

## 12. Settings + theme

- [ ] Theme is locked to LIGHT for now (yellow + white brand only) — confirm no dark mode leakage.
- [ ] Notification preferences toggle (push enable, sound, etc.) persist after backgrounding the app.

## 13. Notifications (in-app)

- [ ] Tap bell on Home → list of notifications.
- [ ] Unread shown with yellow dot.
- [ ] Filter chips: All / Trips / Promos / Account.
- [ ] Tap a notification → navigates to relevant screen (booking, promo).

## 14. Push notifications (FCM, AFTER FCM setup lands)

- [ ] Foreground: push received → in-app banner shows; tap → navigates.
- [ ] Background: push received → OS notification with sound; tap → opens app to the right screen.
- [ ] Killed app: push received → OS notification; tap → cold-starts app to right screen.
- [ ] iOS: works after granting notification permission on first launch.
- [ ] Android: works without explicit permission (pre-13) or after grant (13+).

## 15. Edge cases + negative paths

- [ ] Airplane mode + open app → "No internet" banner appears; queued actions stash safely.
- [ ] Background → restore: state preserved (don't lose half-typed search, don't crash).
- [ ] Rotate device (if supported) → no layout breakage.
- [ ] Deny location permission → app still works; pickup defaults to Agbor centre with a clear "Tap to set pickup" prompt instead of a silent mock location.
- [ ] Force-quit during Paystack payment → on relaunch, booking status is still `pending_payment` and user can retry (no orphaned `paid` without payment).

## 16. Performance

- [ ] Cold start ≤ 4s to first interactive frame on a mid-range Android (Infinix Smart 7 baseline).
- [ ] Search-as-you-type debounced ≤ 400ms; first result on screen ≤ 1s on a good connection.
- [ ] Map tile load ≤ 2s on good connection (allow longer on first install — tile cache empty).
- [ ] No visible jank on bottom-sheet drag at 60fps.

## 17. Memory / battery (long-session)

- [ ] Leave the app open on Home for 10 min → memory doesn't grow > 200MB; no GPS-related battery warning.
- [ ] Background for 5 min, return → app resumes without re-login or losing state.

---

## What to do when a test fails

1. Screenshot the failure + the screen above it (context).
2. Note the **exact step**, **expected vs actual**, and **timestamp** so we can grep Metro logs.
3. File against this checklist row.
4. After we fix → re-run only the failed section, not the whole plan.
