# YB Ride — Staff Dashboard Test Plan

Staff dashboard is the dispatch console: see paid bookings, manually assign a driver, monitor active trips on a live fleet map. Browser-based (React + Vite, deployed to Vercel). Test on **Chrome desktop** as the primary target; spot-check on Safari.

---

## 0. Preconditions

- [ ] Vercel deployment is up at the staff URL.
- [ ] Staff Firebase Auth account exists with `role: 'staff'` in `/users/{uid}` (created by admin).
- [ ] At least one driver account is `isActive: true` and currently `ONLINE` (pinging RTDB).
- [ ] At least one passenger booking is in `pending_payment` and one in `paid` (to verify assignment flow).
- [ ] Cloud Run `createstaffaccount` + `deleteaccount` have `allUsers → Cloud Run Invoker` IAM binding (see [[yb-ride-callable-invoker]]) — otherwise admin-created staff accounts fail at creation.

## 1. Sign in

- [ ] Staff member enters email + password → routes to Dashboard.
- [ ] Non-staff role (passenger/driver) trying to sign in → blocked with "This account doesn't have staff access."
- [ ] Wrong password → inline error.
- [ ] Suspended (`isActive: false`) staff → bounced to Login with "Account suspended."
- [ ] Session persists across browser tabs (localStorage Auth).
- [ ] Sign-out clears session and returns to Login.

## 2. Dashboard (KPIs)

- [ ] Top KPI cards: Today's Bookings, Active Trips, Online Drivers, Today's Revenue.
- [ ] Numbers update live via Firestore `onSnapshot` (no manual refresh).
- [ ] Empty state when zero (e.g. "No active trips") — no `NaN` or `undefined`.
- [ ] Time-range filter (Today / This Week / This Month) updates all KPI cards.

## 3. Bookings queue (the key feature)

- [ ] Default tab: `Paid - Awaiting Driver` (the queue staff actively works).
- [ ] Tabs: Paid / Assigned / In Progress / Completed / Cancelled.
- [ ] Each row shows: booking id, passenger name + phone (clickable to call/SMS), pickup → dropoff, car type, fare, time since paid (turns yellow > 5min, red > 15min).
- [ ] Sort by oldest first by default (oldest waits get assigned first).
- [ ] Filter by car type (Standard / Premium / SUV).
- [ ] Search by passenger name / phone / booking id.
- [ ] Click row → BookingDetail page with full info + map of pickup/dropoff.

## 4. Assign driver (the workflow)

- [ ] From a Paid booking row, click "Assign Driver".
- [ ] Modal opens with a list of currently ONLINE drivers of the matching car type, sorted by ETA to pickup.
- [ ] Each driver row: name, vehicle, current location distance + ETA to pickup, rating, today's trip count.
- [ ] Click a driver → confirmation modal showing the assignment summary.
- [ ] Confirm → booking flips to `assigned`, `driverId` set, driver gets a push notification + the trip appears in their app within ~5s.
- [ ] If the driver doesn't accept within 60s, the assignment auto-reverts to `paid` and staff is notified.
- [ ] Staff can manually unassign a driver while booking is in `assigned` (returns to queue).
- [ ] Cannot assign a driver who is offline or on another active trip — UI blocks it.

## 5. Live fleet map

- [ ] Map renders Google tiles (Agbor centred).
- [ ] All ONLINE drivers shown as markers; colours: green (online idle), yellow (on trip), grey (offline — recent disconnects).
- [ ] Click a marker → driver popup with name, vehicle, current booking (if any), call button.
- [ ] Cluster nearby drivers when zoomed out.
- [ ] Updates every ~5s via RTDB `driver_locations/*` subscriptions.
- [ ] Filter: All / Online idle / On trip.

## 6. Active trips monitor

- [ ] Active Trips tab shows trips currently `assigned`, `driver_arrived`, or `in_progress`.
- [ ] Each card: booking id, driver name + ETA, passenger, status, time elapsed.
- [ ] Click → detail with driver location on map, passenger location, route.
- [ ] If a driver pings stop (>30s gap), card shows "Connection Lost" warning.
- [ ] Staff can manually mark a trip as `completed` or `cancelled` with a reason (override for stuck trips).

## 7. History tab

- [ ] Past 30 days of completed + cancelled bookings.
- [ ] Filter by status, date range, driver, car type.
- [ ] Click → BookingDetail with full timeline + actions taken.
- [ ] CSV export button (if available in MVP).

## 8. Drivers tab

- [ ] List of all drivers with: name, vehicle, status (online/offline/on trip), today's trips, rating, last-online time.
- [ ] Filter by status.
- [ ] Click driver → DriverDetail with profile, trip history, current location on map.
- [ ] Staff cannot edit driver profiles (admin-only) — UI is read-only.

## 9. Settings + Sign out

- [ ] Settings page: notification preferences (sound on/off when new paid booking arrives).
- [ ] Sign out → returns to Login.

## 10. Real-time correctness

- [ ] Two staff browsers logged in simultaneously: assignment by one is reflected in the other within ~5s.
- [ ] Cross-tab: open Bookings in one tab + Fleet Map in another — assigning a driver in Bookings shows the driver's pin colour change on the Fleet Map.

## 11. Edge cases

- [ ] No drivers online → assignment modal shows "No drivers available" with a refresh button.
- [ ] Passenger cancels their booking while staff is in the assignment modal → modal auto-dismisses with a toast "Passenger cancelled this trip."
- [ ] Booking older than 30 minutes still in `paid` status → flagged for review (yellow banner).
- [ ] Browser offline → "Lost connection to server — trying to reconnect" banner; queued actions stash; on reconnect, replay.
- [ ] Tab backgrounded for 10+ min → on focus, force-resync all subscriptions (don't trust stale snapshot).

## 12. Performance

- [ ] First contentful paint ≤ 2s on a typical office connection.
- [ ] Bookings list renders 100+ rows without lag.
- [ ] Fleet map smooth at 60fps with 30+ driver markers.
- [ ] Firestore reads minimal — staff dashboards are heavy consumers; verify the query patterns batch correctly.

## 13. Security checks

- [ ] Logged-out user trying to access `/dashboard` → redirected to `/login`.
- [ ] Staff token expires (force a `signOut()` from console) → all subscriptions tear down; next API call returns to Login.
- [ ] Browser dev tools: confirm no Firebase admin keys or service account credentials leak to the bundle.
- [ ] Firestore security rules: staff can read `bookings`, `users` (passengers), `drivers`; CANNOT delete users or change driver `isActive` (admin-only).

## 14. Browser compatibility

- [ ] Chrome (primary) — full test pass.
- [ ] Safari (Mac) — full test pass.
- [ ] Edge — quick smoke test.
- [ ] Mobile Safari (iPhone landscape) — should be USABLE but not optimised; assignment from phone works.

---

## What to do when a test fails

Same protocol — screenshot, browser + version, console errors (open DevTools), file under the matching section.
