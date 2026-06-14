import { Platform } from 'react-native';
import {
  arrayRemove,
  arrayUnion,
  doc,
  setDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './firebase/index';

// ─── Lazy native-module accessor ───────────────────────────────────────────
// `import * as Notifications from 'expo-notifications'` resolves the
// ExpoPushTokenManager JNI module at import time. On Android that module
// only registers when FCM is configured (google-services.json + Firebase
// Android app). Without it the import throws and the app cold-crashes.
//
// Wrap the require so a missing native module just disables push instead
// of taking the whole app down — the rest of the app (auth, ride flow)
// keeps working. Wire FCM properly before launch to re-enable.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _notifications: any = undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNotifications(): any | null {
  if (_notifications !== undefined) return _notifications;
  try {
    _notifications = require('expo-notifications');
  } catch (err) {
    if (__DEV__) console.warn('expo-notifications unavailable', err);
    _notifications = null;
  }
  return _notifications;
}

// ─── Foreground behaviour ──────────────────────────────────────────────────
// Lazy — called the first time we actually need a token.

let _handlerInstalled = false;
function ensureNotificationHandler(): void {
  if (_handlerInstalled) return;
  const N = getNotifications();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    _handlerInstalled = true;
  } catch (err) {
    if (__DEV__) console.warn('setNotificationHandler failed', err);
  }
}

// ─── Android channels ──────────────────────────────────────────────────────

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const N = getNotifications();
  if (!N) return;
  try {
    await N.setNotificationChannelAsync('default', {
      name: 'Trip updates',
      description: 'Driver assigned, driver arrived, trip completed, etc.',
      importance: N.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FACC15',
    });
  } catch (err) {
    if (__DEV__) console.warn('setNotificationChannelAsync failed', err);
  }
}

// ─── Token registration ────────────────────────────────────────────────────

interface RegisterResult {
  ok: boolean;
  token?: string;
  reason?: string;
}

/**
 * Ask for permission, fetch the device push token, and write it under
 * /users/{uid}.fcmTokens. Idempotent via arrayUnion — calling on every
 * sign-in is safe.
 *
 * No-ops on web AND when expo-notifications native side isn't available
 * (FCM not yet wired); the rest of the auth flow still completes.
 */
export async function registerForPushNotifications(
  passengerId: string,
): Promise<RegisterResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'web' };
  if (!FIREBASE_CONFIGURED) return { ok: false, reason: 'firebase-not-configured' };
  const N = getNotifications();
  if (!N) return { ok: false, reason: 'notifications-native-missing' };

  ensureNotificationHandler();
  await setupAndroidChannels();

  let granted = false;
  try {
    const settings = await N.getPermissionsAsync();
    granted = settings.granted;
    if (!granted) {
      const req = await N.requestPermissionsAsync();
      granted = req.granted;
    }
  } catch (err) {
    if (__DEV__) console.warn('permissions check failed', err);
    return { ok: false, reason: 'permission-check-failed' };
  }
  if (!granted) return { ok: false, reason: 'permission-denied' };

  let token: string;
  try {
    const res = await N.getDevicePushTokenAsync();
    token = res.data;
  } catch (err) {
    if (__DEV__) console.warn('getDevicePushTokenAsync failed', err);
    return { ok: false, reason: 'token-failed' };
  }

  try {
    const db = getDb()!;
    await setDoc(
      doc(db, COLLECTIONS.USERS, passengerId),
      { id: passengerId, fcmTokens: arrayUnion(token), updatedAt: Date.now() },
      { merge: true },
    );
  } catch (err) {
    if (__DEV__) console.warn('persist FCM token failed', err);
    return { ok: false, reason: 'persist-failed', token };
  }

  return { ok: true, token };
}

/**
 * Remove the current device's token from the passenger doc — call on sign-out
 * so the driver/admin doesn't notify a logged-out user.
 */
export async function unregisterPushNotifications(passengerId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!FIREBASE_CONFIGURED) return;
  const N = getNotifications();
  if (!N) return;
  try {
    const res = await N.getDevicePushTokenAsync();
    const token = res.data;
    const db = getDb()!;
    await setDoc(
      doc(db, COLLECTIONS.USERS, passengerId),
      { fcmTokens: arrayRemove(token), updatedAt: Date.now() },
      { merge: true },
    );
  } catch (err) {
    if (__DEV__) console.warn('unregister FCM token failed', err);
  }
}
