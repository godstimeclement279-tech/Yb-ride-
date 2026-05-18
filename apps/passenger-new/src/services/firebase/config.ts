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
  apiKey: 'AIzaSyBDQefp71mA1_02K-hRbeIcc7Uq33JpNlg',
  authDomain: 'yb-ride-fe206.firebaseapp.com',
  projectId: 'yb-ride-fe206',
  storageBucket: 'yb-ride-fe206.firebasestorage.app',
  messagingSenderId: '191199341592',
  appId: '1:191199341592:web:bb4041c56691cb63bc676d',
  databaseURL: 'https://yb-ride-fe206-default-rtdb.europe-west1.firebasedatabase.app',
};

// True only when every value has been filled in. Drives mock-vs-real switching
// throughout the firebase services.
export const FIREBASE_CONFIGURED =
  !FIREBASE_CONFIG.apiKey.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.projectId.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.databaseURL.startsWith('PASTE_');
