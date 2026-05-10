// ┌──────────────────────────────────────────────────────────────────────────┐
// │  Firebase config                                                         │
// │                                                                          │
// │  Replace the PASTE_… placeholders below with the values you copy from    │
// │  Firebase Console. While they are placeholders, the whole app falls back │
// │  to mock data — nothing crashes.                                         │
// │                                                                          │
// │  Where to find each value:                                               │
// │    • apiKey, authDomain, projectId, storageBucket,                       │
// │      messagingSenderId, appId                                            │
// │        → Project Settings (gear icon) → Your apps → Web app → SDK setup  │
// │    • databaseURL                                                         │
// │        → Realtime Database → Data tab → URL at top of the page          │
// │          (looks like https://yb-ride-prod-default-rtdb.…firebasedatabase.app)│
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

// True only when every value has been filled in. Drives mock-vs-real switching
// throughout the firebase services.
export const FIREBASE_CONFIGURED =
  !FIREBASE_CONFIG.apiKey.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.projectId.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.databaseURL.startsWith('PASTE_');
