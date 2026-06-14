# YB Ride — Admin Dashboard Test Plan

Admin owns the platform: create staff + drivers, set car-type pricing, draw zones, run promos, view analytics, suspend bad actors. Web-based, Vercel-deployed.

---

## 0. Preconditions

- [ ] Vercel admin deployment is up.
- [ ] One admin Firebase Auth account exists with `role: 'admin'` (bootstrap manually in Firebase console for the very first admin).
- [ ] Cloud Run `createstaffaccount` + `deleteaccount` have `allUsers → Cloud Run Invoker` (see [[yb-ride-callable-invoker]]).
- [ ] Firebase Storage rules allow admin to upload driver document images.

## 1. Sign in + role gate

- [ ] Admin signs in → routes to Dashboard.
- [ ] Non-admin role → bounced with "Admin access only."
- [ ] Wrong credentials → inline error.
- [ ] Sign-out works; revoking admin role mid-session (via Firebase console) eventually drops them on next route.

## 2. Dashboard (KPIs + recent activity)

- [ ] Top KPIs: Total Active Bookings, Total Drivers, Total Passengers, GMV today, GMV this month.
- [ ] "Recent activity" feed: last 20 events (signups, completed trips, suspensions).
- [ ] Time-range filter updates KPIs.
- [ ] Charts: Bookings per hour today, Revenue trend last 30 days, Top drivers by earnings.
- [ ] No `NaN` on empty data.

## 3. Users page (all roles)

- [ ] Three tabs: Passengers / Drivers / Staff.
- [ ] Passenger list: name, phone, email, total trips, signup date, status (active/suspended).
- [ ] Search + filter by status + sort by signup date / trips.
- [ ] Click passenger → PassengerDetail with profile + trip history + suspend/restore button.
- [ ] Suspend → flips `isActive: false`; passenger app drops them to a "Your account is suspended" screen.
- [ ] Restore → re-enables; user can sign in again.
- [ ] HARD delete passenger → Firebase Auth user + Firestore doc both removed; soft-deleted bookings preserved.

## 4. Add a driver (the key feature)

- [ ] "+ Add Driver" button.
- [ ] Form fields: name, email, phone, password (auto-generated, copyable, regenerable), car type, vehicle make / model / year / plate / colour.
- [ ] Document uploads: license, vehicle papers, insurance — placeholder slots in MVP.
- [ ] Submit → calls `createStaffAccount` Cloud Function with `role: 'driver'`.
- [ ] Success → success modal with email + the auto-generated password (admin copies + shares with driver).
- [ ] Driver appears in Drivers list with `isActive: false` (pending approval).
- [ ] Admin clicks "Approve" → driver `isActive: true`; driver can now sign in.
- [ ] Cloud Function failure → error message describes the cause (don't show generic "internal" — see callable-invoker memory).

## 5. Add staff

- [ ] Same flow as Add Driver but no vehicle fields; just name, email, phone, password, permissions.
- [ ] Permissions checkboxes (MVP minimum): View Bookings, Assign Drivers, Cancel Trips.
- [ ] Staff appears in Staff tab; admin can edit permissions later.

## 6. Driver detail + actions

- [ ] Profile section: photo, contact, vehicle, documents.
- [ ] Trip history with filter.
- [ ] Earnings summary.
- [ ] Actions: Approve / Suspend / Edit vehicle / Delete account.
- [ ] Suspend → `isActive: false`; if driver is online + on a trip, finish current trip but no new trips assigned.
- [ ] Delete → confirms twice; `deleteAccount` Cloud Function removes auth + doc.

## 7. Car-type pricing (PricingPage)

- [ ] List of car types: Standard / Premium / SUV (or whatever exists).
- [ ] Each row shows: name, base fare, price per km, seat count, icon.
- [ ] Click → edit form.
- [ ] Edit + Save → writes to `/carTypes/{id}` Firestore doc.
- [ ] Passenger app picks up the new price on next car-list refresh (within ~5s via subscription).
- [ ] Add new car type ("Luxury" etc) → appears in passenger app's Select Ride.
- [ ] Toggle `isActive` → hides car type from passenger app without deleting.
- [ ] Delete → confirms; removed from Firestore; passenger app stops showing it.

## 8. Zone-based pricing (ZonesPage) ⭐ — the differentiator

- [ ] Map shows all defined zones with coloured polygons + name labels.
- [ ] "+ Add Zone" → polygon drawing tool active on the map.
- [ ] Click points → polygon outlined → close shape → form: zone name, surcharge ₦.
- [ ] Save → polygon persists to `/zones/{id}`.
- [ ] Edit zone: drag vertices, change surcharge.
- [ ] Delete zone: confirmation, removes from map + Firestore.
- [ ] Test: passenger booking with pickup/dropoff inside a zone → fare includes surcharge automatically.
- [ ] Overlapping zones: highest-surcharge zone wins (or sum — confirm with PRD).
- [ ] Zone hit-detection accurate at zoom levels 12-18.

## 9. Promos (PromosPage)

- [ ] List of promo codes with code, type (percentage / fixed), value, min trip amount, start + end dates, redemption count, active toggle.
- [ ] Create promo: form validates dates, percentage 1-100, fixed amount ≥ 0.
- [ ] Activate / deactivate without deleting.
- [ ] Delete → confirms + removes from Firestore.
- [ ] Edit existing promo → changes propagate to passenger app's PromoCodes screen.
- [ ] Usage limit: cap per user (e.g. 3 uses); enforce in Cloud Functions during booking creation.

## 10. Bookings page (admin view)

- [ ] All bookings across all states.
- [ ] Filter by status, date, passenger, driver, car type.
- [ ] Click → BookingDetail with full timeline + audit log (who did what when).
- [ ] Admin can force-cancel any booking (with reason); writes audit entry.
- [ ] Refund button (placeholder for MVP) → marks booking as `refunded`; Paystack refund is a future Stage 4c.

## 11. Analytics

- [ ] Revenue trends: line chart for last 30/90 days with daily/weekly granularity.
- [ ] Driver leaderboard: top 10 by earnings, trips, rating.
- [ ] Hot zones heat map: pickup density across Agbor.
- [ ] Cancellation rate: per driver, per zone, per time of day.
- [ ] All charts have empty states + loading skeletons.
- [ ] Export to CSV button works.

## 12. Settings

- [ ] Platform settings: support phone, support email, ToS URL, Privacy URL.
- [ ] Operational settings: minimum surge cap, max trip distance, idle driver timeout.
- [ ] Save → propagates to passenger / driver / staff apps via Firestore subscription.

## 13. Audit log (if implemented MVP)

- [ ] Every privileged action (create user, suspend, edit pricing, delete promo) writes to `/audit/{id}` with admin uid, action, target, timestamp.
- [ ] Audit log viewer with filter by admin / action / date range.

## 14. Security / role separation

- [ ] Logged-out admin → bounced to Login on any route.
- [ ] Staff signing in via admin URL → blocked (role mismatch).
- [ ] Firebase rules: admin can read/write everything; staff is more restricted; driver/passenger only their own data.
- [ ] Bundle: no admin SDK keys, no service account leak.

## 15. Edge cases

- [ ] Cloud Run cold start on first call after idle → admin sees a brief loading spinner, then success (don't show error).
- [ ] Two admins editing the same car type simultaneously → last write wins; consider a "Stale data — refresh" warning if optimistic-locking detects a conflict.
- [ ] Drawing a self-intersecting zone polygon → UI prevents save with a clear error.
- [ ] Deleting a car type with active bookings using it → block delete + show "X active bookings use this car type."

## 16. Performance

- [ ] First load ≤ 3s on typical connection.
- [ ] Bookings list with 1000+ rows uses virtualization (no jank).
- [ ] Analytics queries: should run server-side via Cloud Functions for fanned-out aggregations; UI shouldn't pull all bookings to count.

---

## What to do when a test fails

Screenshot, browser + version, console errors, file under the matching section. For Cloud Function failures, also capture the Cloud Run logs URL.
