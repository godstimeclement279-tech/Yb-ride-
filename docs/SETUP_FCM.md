# Firebase Cloud Messaging (FCM) Setup

Push notifications across all 4 apps (passenger, driver, staff, admin). The wiring (`expo-notifications` + `registerForPushNotifications` services) is already in the code; what's missing is the **server-side credentials** that let EAS-built APKs and iOS apps actually exchange tokens with FCM.

Symptom of unfinished setup (seen in Metro logs this session):
```
getDevicePushTokenAsync failed
Default FirebaseApp is not initialized in this process com.ybride.passenger.
```

That's exactly the FCM-not-wired error. This doc fixes it.

---

## Step 1 — Android: upload google-services.json to EAS

1. Firebase Console → Project Settings → **Your apps** → tap the Android app row.
2. If there's no Android app yet for `com.ybride.passenger`, **Add app** → bundle `com.ybride.passenger` → register.
3. Repeat for `com.ybride.driver`, `com.ybride.staff.web` (only for FCM web push later), and any others.
4. For each Android app, click **Download `google-services.json`**.
5. Upload to EAS for each Expo project:
   ```
   cd apps/passenger-new
   eas credentials -p android
   # Pick development → Android Service Account
   # → "Configure FCM server key" → paste / upload the JSON
   ```
   Repeat in `apps/driver`.

EAS attaches the credential to all future builds in that project. **You must rebuild** for it to take effect — existing installed builds have no FCM credential and will keep failing.

---

## Step 2 — Android: confirm `google-services.json` is bundled

EAS Build with the credential set will inject it into the native build. To verify, after the next build:
1. Download the `.apk` from the EAS dashboard.
2. Unzip → look for `assets/google-services.json` (some builds put it in `res/raw`).
3. If missing: the credential wasn't attached. Re-run Step 1.

---

## Step 3 — iOS: APNs key

1. Apple Developer portal → **Keys** → **+**.
2. Name: `YB Ride APNs Key`.
3. Tick **Apple Push Notifications service (APNs)** → Continue → Register.
4. Download the `.p8` file. **Only downloadable once.** Save securely.
5. Note the **Key ID** + your **Team ID**.

---

## Step 4 — iOS: upload APNs key to Firebase

1. Firebase Console → Project Settings → **Cloud Messaging** → iOS app config row → **APNs Authentication Key** → **Upload**.
2. Upload the `.p8`.
3. Enter Key ID + Team ID.
4. Save.

Firebase can now mint APNs-bound FCM tokens for iOS clients.

---

## Step 5 — iOS: provisioning profile must include Push Notifications

EAS handles this automatically when `app.config.js` declares the capability:

```js
ios: {
  bundleIdentifier: 'com.ybride.passenger',
  entitlements: {
    'aps-environment': 'production',  // EAS production profile
  },
  // expo-notifications config plugin enables this automatically when listed
}
```

`expo-notifications` config plugin already does this — confirm the passenger + driver `app.config.js` lists `expo-notifications` in `plugins` (✓ already done).

Run `eas credentials -p ios` → make sure the active provisioning profile includes the Push Notifications capability. If not, EAS will offer to regenerate.

---

## Step 6 — Rebuild

```
cd apps/passenger-new
eas build --platform android --profile development
eas build --platform ios --profile development

cd ../driver
eas build --platform android --profile development
eas build --platform ios --profile development
```

Install the new builds. Open the app once and grant notification permission (iOS prompts on first send; Android 13+ also prompts).

---

## Step 7 — Send a test push

From Firebase Console → Cloud Messaging → **Send your first message**:
- Title: "YB Ride test"
- Text: "Hello from FCM"
- Target → Single device → paste the FCM token from the app (log it on first launch with `console.log` for testing only).

Should arrive within a few seconds:
- Foreground: in-app notification (handled by `expo-notifications` foreground handler).
- Background: OS notification tray.
- Killed app: OS notification tray with deep-link payload.

---

## Step 8 — Custom sound for driver "new trip" alert

The driver needs a louder/distinct sound for trip assignments (so they hear it while driving).

1. Drop `urgent.wav` (or `.caf` for iOS) into `apps/driver/assets/sounds/`.
2. In `app.config.js`:
   ```js
   [
     'expo-notifications',
     {
       color: '#FACC15',
       sounds: ['./assets/sounds/urgent.wav'],
     },
   ],
   ```
3. Server-side (Cloud Function that triggers the trip-assignment push), set:
   ```js
   notification: { sound: 'urgent.wav' }
   ```
4. Android channel must allow custom sound (`expo-notifications` creates the channel automatically; `sound: 'urgent.wav'` in the notification triggers it).

---

## Step 9 — Sending pushes from the server

The current code's `registerForPushNotifications` stores the FCM token in `/users/{uid}.pushToken`. To actually send a push from a Cloud Function:

```ts
// firebase/functions/src/notifications/sendTripAssigned.ts
import * as admin from 'firebase-admin';

export async function sendTripAssignedToDriver(driverId: string, bookingId: string) {
  const driverDoc = await admin.firestore().doc(`users/${driverId}`).get();
  const token = driverDoc.data()?.pushToken;
  if (!token) return;

  await admin.messaging().send({
    token,
    notification: {
      title: 'New trip',
      body: 'Tap to view pickup and start navigation.',
    },
    data: { bookingId, type: 'trip_assigned' },
    android: { priority: 'high', notification: { sound: 'urgent', channelId: 'trips' } },
    apns: { payload: { aps: { sound: 'urgent.wav', 'content-available': 1 } } },
  });
}
```

Trigger this from a Firestore trigger on `bookings/{id}` when `driverId` field changes.

---

## Verification checklist

- [ ] Android push arrives in foreground + background + killed states.
- [ ] iOS push arrives in same 3 states.
- [ ] Tap on a push opens the app to the relevant screen (deep-link via `data` field).
- [ ] Driver's "urgent" sound plays for trip assignments (not the default sound).
- [ ] No `Default FirebaseApp is not initialized` error in Metro logs.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `getDevicePushTokenAsync failed` in dev client | Dev client was built BEFORE you uploaded `google-services.json`. Rebuild. |
| Push arrives in foreground but not background | OS notification handler isn't called when foreground notification handler suppresses it. Set `shouldShowAlert: true` in the foreground handler config. |
| iOS works in TestFlight but not production | Production APNs key vs sandbox mismatch. Apple now uses one key for both — make sure it's the right one in Firebase. |
| Android push not respecting custom sound | Channel was created before sound was added — uninstall + reinstall the app to recreate the channel with new config. |
