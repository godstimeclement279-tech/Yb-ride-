import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
// initializeAuth + getReactNativePersistence are exported from
// 'firebase/auth' in v10+; the TS types omit getReactNativePersistence for
// historical reasons, so we import it via a cast.
import {
  initializeAuth,
  getAuth,
  // @ts-expect-error getReactNativePersistence ships in firebase/auth but
  // is not in the public TS declarations yet — bug tracked upstream.
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FIREBASE_CONFIG, FIREBASE_CONFIGURED } from './config';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;

function init(): void {
  if (_app || !FIREBASE_CONFIGURED) return;
  _app = initializeApp(FIREBASE_CONFIG);
  // Long polling avoids a known WebChannel issue on React Native / Hermes.
  _db = initializeFirestore(_app, { experimentalForceLongPolling: true });
  _rtdb = getDatabase(_app);
  _storage = getStorage(_app);

  if (Platform.OS === 'web') {
    // Browser persistence is the JS-SDK default (IndexedDB).
    _auth = getAuth(_app);
  } else {
    // RN needs AsyncStorage so sessions survive app restarts.
    _auth = initializeAuth(_app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
}

export function getApp(): FirebaseApp | null {
  init();
  return _app;
}
export function getDb(): Firestore | null {
  init();
  return _db;
}
export function getRtdb(): Database | null {
  init();
  return _rtdb;
}
export function getFbStorage(): FirebaseStorage | null {
  init();
  return _storage;
}
export function getFbAuth(): Auth | null {
  init();
  return _auth;
}

export { FIREBASE_CONFIGURED };
