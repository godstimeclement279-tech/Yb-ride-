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
// When a push arrives while the passenger is using the app, show the
// banner + play the bundled sound so they don't miss "driver arrived".

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Android channels ──────────────────────────────────────────────────────
// Only one channel for the passenger — trip updates use the default sound +
// default importance. The driver app gets a separate "urgent" channel for
// new-assignment alerts.

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Trip updates',
    description: 'Driver assigned, driver arrived, trip completed, etc.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1E3A8A',
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
 * /passengers/{uid}.fcmTokens. Idempotent via arrayUnion — calling on every
 * sign-in is safe.
 *
 * No-ops on web (Expo's notifications module doesn't ship web push out of
 * the box; the staff dashboard plays its own audio alert instead).
 */
export async function registerForPushNotifications(
  passengerId: string,
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
  try {
    const res = await Notifications.getDevicePushTokenAsync();
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
