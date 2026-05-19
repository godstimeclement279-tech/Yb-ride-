// Legacy seeder — kept only to repopulate the test-driver-123 Firestore
// doc that older mock paths reference. The real driver onboarding flow now
// runs through admin-web's "Add driver" callable (createStaffAccount with
// role='driver'), which provisions the Firebase Auth user AND the
// /drivers/{authUid} doc together. The doc this script writes uses the
// legacy 'test-driver-123' id, which does NOT match any real Auth uid, so
// you cannot log into the driver app with it — use the admin dashboard
// instead. Run from yb-ride/firebase/ as `node seedDriver.mjs`.
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBDQefp71mA1_02K-hRbeIcc7Uq33JpNlg',
  authDomain: 'yb-ride-fe206.firebaseapp.com',
  projectId: 'yb-ride-fe206',
  storageBucket: 'yb-ride-fe206.firebasestorage.app',
  messagingSenderId: '191199341592',
  appId: '1:191199341592:web:bb4041c56691cb63bc676d',
  databaseURL: 'https://yb-ride-fe206-default-rtdb.europe-west1.firebasedatabase.app',
};

const TEST_DRIVER = {
  id: 'test-driver-123',
  name: 'Emeka Okafor',
  phone: '+2348012345678',
  email: 'emeka@yb-ride.test',
  carTypeId: 'standard',
  vehicle: {
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    plate: 'AGB-123-XY',
    color: 'White',
  },
  documents: {
    licenseUrl: '',
    insuranceUrl: '',
    vehiclePapersUrl: '',
  },
  isActive: true,
  status: 'offline',
  averageRating: 4.9,
  totalRides: 124,
  createdBy: 'test-admin-123',
  createdAt: Date.now(),
};

async function seed() {
  console.log(`> Connecting to ${FIREBASE_CONFIG.projectId} ...`);
  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);

  console.log(`> Writing drivers/${TEST_DRIVER.id} ...`);
  const { id, ...data } = TEST_DRIVER;
  await setDoc(doc(db, 'drivers', id), data, { merge: true });
  console.log('✔ Test driver doc written.');
  console.log('');
  console.log('Note: this doc cannot be used to sign in to the driver app —');
  console.log('the app now uses Firebase Auth. Onboard a real driver via');
  console.log('admin-web ("Add driver") so Auth + Firestore stay in sync.');
  process.exit(0);
}

seed().catch(err => {
  console.error('✖ Seed failed:', err);
  process.exit(1);
});
