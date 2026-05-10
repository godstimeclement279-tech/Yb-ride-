import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';
import { FIREBASE_CONFIG, FIREBASE_CONFIGURED } from './config';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;
let _auth: Auth | null = null;

function init(): void {
  if (_app || !FIREBASE_CONFIGURED) return;
  _app = initializeApp(FIREBASE_CONFIG);
  _db = getFirestore(_app);
  _rtdb = getDatabase(_app);
  _auth = getAuth(_app);
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
export function getFbAuth(): Auth | null {
  init();
  return _auth;
}

export { FIREBASE_CONFIGURED };
