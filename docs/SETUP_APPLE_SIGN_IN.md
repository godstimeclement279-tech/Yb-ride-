# Sign in with Apple — Setup Walkthrough

The code wiring is done (`apps/passenger-new/src/services/appleAuth.ts` + LoginScreen button + `expo-apple-authentication` dep + `ios.usesAppleSignIn: true` in `app.config.js`).

What's left is **5 manual configuration steps** that touch your Apple Developer account, your Firebase project, and one EAS build. Do them in this exact order.

---

## Prerequisites

- Apple Developer Program enrolment is **active** ($99/year). The personal account is enough.
- You have access to the Firebase console for project `yb-ride-fe206`.
- Mac access (not strictly required, but the Apple key needs uploading and Apple's UI plays nicer on Safari).

---

## Step 1 — Enable "Sign in with Apple" on the App ID

1. Open https://developer.apple.com/account/resources/identifiers/list.
2. Find **`com.ybride.passenger`** in the App IDs list. (If it's not there, EAS created it on your first iOS build — check Bundle IDs.)
3. Click the App ID → scroll to **Capabilities** → tick **Sign In with Apple**.
4. Click **Configure** beside it → choose **Enable as a primary App ID** → Save → Continue → Save.

---

## Step 2 — Create a Services ID

The Services ID is the OAuth client identifier Firebase uses to talk to Apple. The App ID alone isn't enough.

1. https://developer.apple.com/account/resources/identifiers/list → top-right dropdown → **Services IDs** → **+**.
2. Description: `YB Ride Web Auth` (or anything you'll recognise).
3. Identifier: `com.ybride.passenger.signin` (must be unique and distinct from the App ID; convention is the App ID with `.signin` appended).
4. Continue → Register.
5. Open the new Services ID → tick **Sign In with Apple** → **Configure**.
6. Primary App ID: select `com.ybride.passenger`.
7. **Domains and Subdomains**: enter `yb-ride-fe206.firebaseapp.com`.
8. **Return URLs**: enter `https://yb-ride-fe206.firebaseapp.com/__/auth/handler`.
9. Save → Continue → Save.

(The domain + return URL come from Firebase Auth's `authDomain`. They MUST match exactly.)

---

## Step 3 — Generate the Sign in with Apple Key (.p8)

This is the private key Firebase uses to verify Apple identity tokens server-side.

1. https://developer.apple.com/account/resources/authkeys/list → **+**.
2. Key Name: `YB Ride Apple Sign In`.
3. Tick **Sign in with Apple** → **Configure** → Primary App ID: `com.ybride.passenger` → Save.
4. Continue → Register.
5. Click **Download** — you get one `.p8` file. **You can only download it once.** Save it somewhere safe (1Password, encrypted backup).
6. Copy the **Key ID** (10 chars) from the same screen.
7. Note your **Team ID** (top-right corner of the developer portal).

---

## Step 4 — Configure Firebase Auth's Apple provider

1. https://console.firebase.google.com/project/yb-ride-fe206/authentication/providers.
2. Click **Apple** → toggle **Enable**.
3. **Service ID**: `com.ybride.passenger.signin` (the Services ID from Step 2 — NOT the App ID).
4. **Apple team ID**: the 10-char Team ID from Step 3.
5. **Key ID**: the 10-char Key ID from Step 3.
6. **Private key**: open the `.p8` file in a text editor, copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`), paste into the Firebase field.
7. **Save**.

Firebase will start accepting Apple tokens immediately. There's no propagation delay.

---

## Step 5 — Rebuild the iOS passenger app

The `expo-apple-authentication` package and the `ios.usesAppleSignIn: true` capability need a fresh native iOS build. Hot-reload doesn't carry them.

```
cd apps/passenger-new
eas build --platform ios --profile development
```

EAS will:
- Pull the updated entitlements (`com.apple.developer.applesignin`).
- Re-codesign with a provisioning profile that includes Sign in with Apple.
- Build a new dev client `.ipa`.

For App Store submission later: same thing, profile = `production`.

---

## Verification

After the new iOS build is installed:

1. Open the app on iPhone → Login screen.
2. **The "Continue with Apple" button is visible** (it was hidden on the old build because `isAppleAuthAvailable()` returned false).
3. Tap it → native Apple sheet (Face ID / Touch ID / passcode).
4. Authorize → app transitions to the Home screen (signed-in subtree).
5. Open Firebase Console → Authentication → Users. The new user has provider `apple.com` and an Apple-formatted uid.
6. Firestore `/users/{uid}` has a new Passenger doc with name pulled from Apple's response.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Button never appears | `isAppleAuthAvailable()` returned false. Check `Platform.OS === 'ios'`, iOS ≥ 13, you're on the rebuilt build (not the old one). |
| Apple sheet opens but Firebase rejects the token | Service ID / Team ID / Key ID mismatch in Firebase. Re-verify Step 4 exactly. |
| "Invalid client_id" from Apple | The Services ID in Firebase doesn't match the Services ID you registered. They MUST be byte-identical. |
| Works in dev, fails in TestFlight | Production provisioning profile is missing the Sign in with Apple entitlement. Run `eas credentials` and refresh the production profile. |
| App Store reviewer rejects 4.8 | They saw the Google "Coming soon" button but no Apple button. Re-test on a real iPhone — `isAppleAuthAvailable()` should return true. If it doesn't, the build is broken and reviewer is right. |

## Pre-launch checklist

- [ ] Sign in with Apple works on a real iPhone with a real Apple ID (not the simulator).
- [ ] Hide My Email path tested — Firebase stores the `*.privaterelay.appleid.com` address.
- [ ] First-sign-in name capture works (verify `name` field in Firestore is real, not "Apple User").
- [ ] Subsequent sign-ins keep the original name (Apple won't send it again — our code doesn't overwrite).
- [ ] Sign out → sign back in via Apple → returns to existing Firestore doc (no duplicate).
- [ ] User can delete their account (App Store 5.1.1(v) requirement — covered by the existing "Delete Account" flow if implemented).
