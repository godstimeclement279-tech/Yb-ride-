import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { FIREBASE_CONFIG, FIREBASE_CONFIGURED } from './config';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;
let _storage: FirebaseStorage | null = null;

function init(): void {
  if (_app || !FIREBASE_CONFIGURED) return;
  _app = initializeApp(FIREBASE_CONFIG);
  // Long polling avoids a known WebChannel issue on React Native / Hermes.
  _db = initializeFirestore(_app, { experimentalForceLongPolling: true });
  _rtdb = getDatabase(_app);
  _storage = getStorage(_app);
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

export { FIREBASE_CONFIGURED };
