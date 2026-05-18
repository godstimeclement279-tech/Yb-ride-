// Firebase config (admin-web). Replace PASTE_… with values from
// Firebase Console → Project Settings → Your apps → Web app.

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
  appId: '1:191199341592:web:2eb49aca8adcdfe0bc676d',
  databaseURL: 'https://yb-ride-fe206-default-rtdb.europe-west1.firebasedatabase.app',
};

export const FIREBASE_CONFIGURED =
  !FIREBASE_CONFIG.apiKey.startsWith('PASTE_') &&
  !FIREBASE_CONFIG.projectId.startsWith('PASTE_');
