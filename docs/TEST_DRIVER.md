# YB Ride — Driver App Test Plan

End-to-end QA checklist for the driver app. Driver flow is fundamentally different from passenger: toggle online → receive trip → navigate to pickup → start trip → navigate to dropoff → trip ends → earnings update. Test in that order.

---

## 0. Preconditions

- [ ] Latest preview build installed.
- [ ] Driver account exists in admin-web with `isActive: true`, `role: 'driver'`, and a vehicle assigned. Created via admin-web's "Add new driver" flow (requires Cloud Run `createstaffaccount` to allow `allUsers` invoker — see [[yb-ride-callable-invoker]]).
- [ ] Passenger account exists with a paid `pending_payment` or `paid` booking ready to assign (use staff-web to assign it during §4).
- [ ] Phone has cellular data + Location permission granted including **"Allow all the time"** (background tracking requires it).
- [ ] Battery saver OFF (to verify foreground service for background GPS works normally).

## 1. Sign in

- [ ] Driver enters email + password supplied by admin → routes to Home (signed-in).
- [ ] Suspended driver (`isActive: false`) → kicked back to Login with "Your account is not yet approved by admin."
- [ ] Driver doc deleted by admin while online → driver app drops to Login with "Your account was removed by admin."
- [ ] Network error → retry 3× then clean "Could not reach server" message (NOT crash overlay).

## 2. Home (offline)

- [ ] Map renders with Google tiles.
- [ ] Big OFFLINE / Go Online toggle visible.
- [ ] Today + This Week earnings stats show real numbers (₦0 for new driver).
- [ ] Trips counter accurate.
- [ ] Profile + Trips + Earnings tabs in bottom nav work.

## 3. Go Online

- [ ] Tap toggle → OS prompts for "Allow all the time" location permission (if not yet granted).
- [ ] After grant: toggle flips to ONLINE (green), foreground service notification appears in OS notification tray: "YB Ride is sharing your live location".
- [ ] Firebase RTDB `driver_locations/{driverId}` starts receiving GPS pings every ~5s. Confirm in Firebase console or via staff-web fleet map.
- [ ] Battery icon: app shows in "Active" location apps; no thermal warning after 10 min.
- [ ] Toggle OFF → foreground service notification disappears within ~5s; RTDB stops receiving pings; battery returns to normal idle.

## 4. Receiving a trip (from staff-web assignment)

- [ ] Staff member opens staff-web, assigns the driver to a `paid` booking.
- [ ] Driver app: in-app notification + sound within ~3s of assignment (FCM).
- [ ] Notification: "New trip — pickup at X (₦Y, Z min away)".
- [ ] Tap notification → opens NavigationToPickupScreen with map + route + passenger info card.
- [ ] If driver is OFFLINE: assignment is rejected by Cloud rules; staff-web shows error. Driver app shows nothing.

## 5. Navigation to pickup

- [ ] Map shows driver's blue dot + route polyline + pickup pin.
- [ ] ETA + distance to pickup displayed.
- [ ] Passenger info card: name (first name + last initial only — privacy), rating, pickup address.
- [ ] Tap phone icon → dialer with passenger's number (proxy via Twilio later; for MVP it's direct).
- [ ] Tap "Open in Maps" → opens Google Maps with the pickup as destination.
- [ ] Map auto-follows driver as they move (smooth, not jerky).
- [ ] On reaching within ~50m of pickup: prominent "I've Arrived" button highlighted.
- [ ] Tap "I've Arrived" → booking status flips to `driver_arrived`; passenger receives push notif.

## 6. Start trip

- [ ] After arrival: "Start Trip" CTA shown.
- [ ] Tap "Start Trip" → booking flips to `in_progress`; navigation switches to dropoff destination.
- [ ] Map route updates to driver → dropoff polyline.
- [ ] Trip stopwatch starts (visible to driver).

## 7. Active trip

- [ ] Real-time ETA + distance to dropoff updates as driver moves.
- [ ] Tap phone icon → can still call passenger.
- [ ] Tap "Safety Toolkit" → emergency contact / share location placeholder.
- [ ] Passenger app sees driver's pin move on its map in near-real-time.
- [ ] If driver loses signal mid-trip: app caches the last known position, retries on reconnect. Trip is NOT auto-cancelled.

## 8. Ending trip

- [ ] On arrival at dropoff (within ~50m): prominent "Trip Complete" button (NOT fully auto-ended; driver always confirms — see [[project_yb_ride_prd]] design note).
- [ ] Tap "Trip Complete" → booking flips to `completed`; final fare calculated; navigation to TripSummary.
- [ ] TripSummary: distance, time, fare breakdown, "Done" CTA → returns to Home.
- [ ] Today earnings + Trips counter both increment by 1 / +₦X within ~3s.

## 9. Trip cancellation (driver side)

- [ ] Before pickup arrival: driver can cancel via "Cancel Trip" with a reason picker (No-show, Traffic too bad, Other).
- [ ] Cancellation writes `cancellationReason`, `cancelledBy: 'driver'` to booking.
- [ ] Passenger app shows "Trip cancelled by driver — searching for new driver" or routes to Home depending on stage.
- [ ] After "I've Arrived": cancellation requires manual confirm + flag for support review.

## 10. Earnings

- [ ] Tap Earnings tab.
- [ ] Today / This Week / This Month / All Time tabs work.
- [ ] Each trip row: date, pickup → dropoff (short), fare, payout (after platform cut if applicable).
- [ ] Tap row → trip detail with map + fare breakdown.
- [ ] Cash-out button (if used) — not in MVP; verify it's hidden if not implemented.

## 11. Trip history

- [ ] Past trips listed reverse-chronologically.
- [ ] Filter by date / status (completed / cancelled).
- [ ] Tap trip → detail with map preview + summary.

## 12. Profile + documents

- [ ] Profile tab shows avatar, name, rating, total trips, total earnings.
- [ ] Vehicle row → VehicleScreen with make/model/plate/color (edit not in MVP).
- [ ] Documents row → DocumentsScreen with license / vehicle papers / insurance (placeholder upload; "Pending verification" status).
- [ ] Settings row → SettingsScreen (theme, notifications, sign out).

## 13. Settings + Sign out

- [ ] Branded ConfirmDialog on Sign Out (not native Alert).
- [ ] Sign out → returns to Login; foreground service stops; RTDB stops receiving pings.

## 14. Background GPS resilience

- [ ] Drive around for ~5 min while online → passenger app sees driver pin move smoothly.
- [ ] Minimise driver app → foreground service notification persists → pings continue.
- [ ] Kill driver app via task manager → pings STOP within ~30s; staff-web fleet map shows driver as offline. (This is expected — restart app to reconnect.)
- [ ] Driver phone enters tunnel / no signal area → app shows "Reconnecting…" indicator; queues last position; resumes on reconnect.

## 15. Push notifications (after FCM lands)

- [ ] New-trip-assignment push works foreground / background / killed-app states.
- [ ] Sound: louder/alert tone for trip assignments (so driver hears it while driving).
- [ ] Quiet hours respected if driver toggles them in Settings.

## 16. Edge cases

- [ ] Two trips assigned in quick succession → only the first arrives; second is auto-rejected by Cloud rules (a driver can only have one active booking).
- [ ] Driver goes offline mid-trip → trip stays active; staff-web shows "DRIVER OFFLINE" warning on the fleet map.
- [ ] Battery dies mid-trip → on restart, app restores the active trip from Firestore (don't lose state).
- [ ] Driver suspended (admin flips `isActive: false`) mid-trip → driver app shows alert; can finish current trip but no new trips assigned.

## 17. Performance

- [ ] Cold start ≤ 3s.
- [ ] Map renders ≤ 2s on Wi-Fi / good 4G.
- [ ] GPS ping → RTDB write latency ≤ 1s on good connection.
- [ ] Foreground-service battery drain ≤ 10% per 8-hour shift (per PRD target).

---

## What to do when a test fails

Same protocol as passenger plan — screenshot, exact step, expected vs actual, file under the matching section.
