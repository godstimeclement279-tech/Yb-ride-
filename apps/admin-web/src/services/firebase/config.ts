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

// Public Mapbox token — URL-restricted in the Mapbox dashboard so it's safe
// to ship in the bundle. Same token used in the passenger app. Override via
// VITE_MAPBOX_TOKEN in .env.local for local-only experiments.
export const MAPBOX_TOKEN: string =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ??
  'pk.eyJ1IjoiY3J5c3RhbGdlZXRlZSIsImEiOiJjbXA5ZW9ucXExa3J5MnJxenkwcDBqcGhuIn0.JBsGrPj-bun1dvDpoIenEw';
