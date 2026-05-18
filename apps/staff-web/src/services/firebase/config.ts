// ┌──────────────────────────────────────────────────────────────────────────┐
// │  Firebase config (staff-web)                                             │
// │                                                                          │
// │  Same shape as the other apps. Replace PASTE_… with values from the      │
// │  Firebase Console → Project Settings → Your apps → Web app.              │
// │                                                                          │
// │  Mapbox token: drop your public token in VITE_MAPBOX_TOKEN inside        │
// │  .env.local (next to package.json) — the Fleet map auto-falls back to    │
// │  a static placeholder if missing.                                        │
// └──────────────────────────────────────────────────────────────────────────┘

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL: string;
}

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyBDQefp71mA1_02K-hRbeIcc7Uq33JpNlg',
  authDomain: 'yb-ride-fe206.firebaseapp.com',
  projectId: 'yb-ride-fe206',
  storageBucket: 'yb-ride-fe206.firebasestorage.app',
  messagingSenderId: '191199341592',
  appId: '1:191199341592:web:b8f0e8d574222124bc676d',
  databaseURL: 'https://yb-ride-fe206-default-rtdb.europe-west1.firebasedatabase.app',
};

export const FIREBASE_CONFIGURED =
  !FIREBASE_CONFIG.apiKey.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.projectId.startsWith('PASTE_');

export const MAPBOX_TOKEN: string =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ?? '';
