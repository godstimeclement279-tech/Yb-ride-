// One-shot driver seeder for end-to-end testing.
// Creates a test driver doc so the driver app can log in via phone lookup.
// Run from yb-ride/firebase/:
//   node seedDriver.mjs
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
  console.log('✔ Driver seeded.');
  console.log('');
  console.log('Driver app login credentials:');
  console.log(`  phone:    ${TEST_DRIVER.phone}`);
  console.log(`  password: driver123  (hardcoded in driver app for MVP)`);
  process.exit(0);
}

seed().catch(err => {
  console.error('✖ Seed failed:', err);
  process.exit(1);
});
