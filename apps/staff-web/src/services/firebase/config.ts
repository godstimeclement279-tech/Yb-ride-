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
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_AUTH_DOMAIN',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
  databaseURL: 'PASTE_DATABASE_URL',
};

export const FIREBASE_CONFIGURED =
  !FIREBASE_CONFIG.apiKey.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.projectId.startsWith('PASTE_');

export const MAPBOX_TOKEN: string =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ?? '';
