import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  arrayRemove,
  arrayUnion,
  doc,
  setDoc,
} from 'firebase/firestore';
import { COLLECTIONS } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './firebase/index';

// ─── Foreground behaviour ──────────────────────────────────────────────────
// Drivers must hear incoming-trip alerts even while the app is foregrounded.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Android channels ──────────────────────────────────────────────────────
// Two channels:
//   - default: routine trip-state updates (cancellations, etc.)
//   - urgent : new-assignment offers. MAX importance, vibrates aggressively,
//              bypasses Do-Not-Disturb if the OS lets us (Android exposes
//              the toggle in system settings — we set the channel up to
//              request it).
//
// To swap the urgent sound for a custom WAV later:
//   1. Drop the file at apps/driver/assets/sounds/urgent.wav (44.1 kHz, mono
//      or stereo, < 30 s).
//   2. Change the `sound:` field below to 'urgent.wav'.
//   3. Add the file path to app.config.js -> plugins -> expo-notifications.

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Trip updates',
    description: 'Status changes for trips you are already on.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1E3A8A',
  });
  await Notifications.setNotificationChannelAsync('urgent', {
    name: 'New trip offers',
    description: 'A passenger is waiting. These alerts must reach you fast.',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 800, 400, 800, 400, 800],
    enableVibrate: true,
    lightColor: '#1E3A8A',
    bypassDnd: true,
    showBadge: true,
  });
}

// ─── Token registration ────────────────────────────────────────────────────

interface RegisterResult {
  ok: boolean;
  token?: string;
  reason?: string;
}

/**
 * Ask for permission, fetch the device push token, and write it under
 * /drivers/{uid}.fcmTokens. Idempotent — safe to call on every sign-in.
 * No-ops on web.
 */
export async function registerForPushNotifications(
  driverId: string,
): Promise<RegisterResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'web' };
  if (!FIREBASE_CONFIGURED) return { ok: false, reason: 'firebase-not-configured' };

  await setupAndroidChannels();

  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return { ok: false, reason: 'permission-denied' };

  let token: string;
  try {
    const res = await Notifications.getDevicePushTokenAsync();
    token = res.data;
  } catch (err) {
    if (__DEV__) console.warn('getDevicePushTokenAsync failed', err);
    return { ok: false, reason: 'token-failed' };
  }

  try {
    const db = getDb()!;
    await setDoc(
      doc(db, COLLECTIONS.DRIVERS, driverId),
      { id: driverId, fcmTokens: arrayUnion(token), updatedAt: Date.now() },
      { merge: true },
    );
  } catch (err) {
    if (__DEV__) console.warn('persist FCM token failed', err);
    return { ok: false, reason: 'persist-failed', token };
  }

  return { ok: true, token };
}

/**
 * Remove this device's token on sign-out so the app doesn't keep waking
 * drivers who are no longer signed in.
 */
export async function unregisterPushNotifications(driverId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!FIREBASE_CONFIGURED) return;
  try {
    const res = await Notifications.getDevicePushTokenAsync();
    const token = res.data;
    const db = getDb()!;
    await setDoc(
      doc(db, COLLECTIONS.DRIVERS, driverId),
      { fcmTokens: arrayRemove(token), updatedAt: Date.now() },
      { merge: true },
    );
  } catch (err) {
    if (__DEV__) console.warn('unregister FCM token failed', err);
  }
}
