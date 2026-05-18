// One-shot Firestore seeder for car types, zones, and a few sample promos.
// Idempotent: rerunning is safe (skips collections that already have docs).
//
// Run from the yb-ride/firebase/ folder:
//   node seed.mjs
//
// Requires only the standard firebase web SDK (already a workspace dep).
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBDQefp71mA1_02K-hRbeIcc7Uq33JpNlg',
  authDomain: 'yb-ride-fe206.firebaseapp.com',
  projectId: 'yb-ride-fe206',
  storageBucket: 'yb-ride-fe206.firebasestorage.app',
  messagingSenderId: '191199341592',
  appId: '1:191199341592:web:bb4041c56691cb63bc676d',
  databaseURL: 'https://yb-ride-fe206-default-rtdb.europe-west1.firebasedatabase.app',
};

const COLLECTIONS = {
  CAR_TYPES: 'carTypes',
  ZONES: 'zones',
  PROMOS: 'promos',
};

const DEFAULT_CAR_TYPES = [
  { id: 'standard', name: 'Standard', baseFare: 50000, pricePerKm: 10000, seats: 4, sortOrder: 1 },
  { id: 'premium', name: 'Premium', baseFare: 80000, pricePerKm: 15000, seats: 4, sortOrder: 2 },
  { id: 'suv', name: 'SUV', baseFare: 100000, pricePerKm: 20000, seats: 6, sortOrder: 3 },
];

const DEFAULT_ZONES = [
  {
    name: 'Agbor Central',
    polygon: [
      { latitude: 6.245, longitude: 6.190 },
      { latitude: 6.260, longitude: 6.190 },
      { latitude: 6.260, longitude: 6.205 },
      { latitude: 6.245, longitude: 6.205 },
    ],
    surcharge: 15000,
    isActive: true,
    createdBy: 'test-admin-123',
  },
];

const now = Date.now();
const oneYear = 1000 * 60 * 60 * 24 * 365;

// Match the codes the UI references and include every required Promo field.
const DEFAULT_PROMOS = [
  {
    id: 'WELCOME50',
    code: 'WELCOME50',
    kind: 'percentage',
    value: 50,
    maxDiscount: 100000,
    minTripAmount: 50000,
    usageLimit: 3,
    usageCount: 0,
    startsAt: now,
    expiresAt: now + oneYear,
    isActive: true,
    createdBy: 'test-admin-123',
    createdAt: now,
  },
  {
    id: 'WEEKEND20',
    code: 'WEEKEND20',
    kind: 'percentage',
    value: 20,
    minTripAmount: 80000,
    usageCount: 0,
    startsAt: now,
    expiresAt: now + oneYear,
    isActive: true,
    createdBy: 'test-admin-123',
    createdAt: now,
  },
  {
    id: 'LOYALTY10',
    code: 'LOYALTY10',
    kind: 'percentage',
    value: 10,
    usageCount: 0,
    startsAt: now,
    expiresAt: now + oneYear,
    isActive: true,
    createdBy: 'test-admin-123',
    createdAt: now,
  },
];

async function seed() {
  console.log(`> Connecting to ${FIREBASE_CONFIG.projectId} ...`);
  const app = initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);

  let carTypesAdded = 0;
  let zonesAdded = 0;
  let promosAdded = 0;

  console.log('> Checking carTypes ...');
  const ctSnap = await getDocs(collection(db, COLLECTIONS.CAR_TYPES));
  if (ctSnap.empty) {
    for (const ct of DEFAULT_CAR_TYPES) {
      await setDoc(doc(db, COLLECTIONS.CAR_TYPES, ct.id), {
        name: ct.name,
        baseFare: ct.baseFare,
        pricePerKm: ct.pricePerKm,
        seats: ct.seats,
        sortOrder: ct.sortOrder,
        isActive: true,
      });
      carTypesAdded++;
    }
  } else {
    console.log(`  (skip — ${ctSnap.size} carTypes already present)`);
  }

  console.log('> Checking zones ...');
  const zoneSnap = await getDocs(collection(db, COLLECTIONS.ZONES));
  if (zoneSnap.empty) {
    for (const z of DEFAULT_ZONES) {
      await addDoc(collection(db, COLLECTIONS.ZONES), { ...z, createdAt: Date.now() });
      zonesAdded++;
    }
  } else {
    console.log(`  (skip — ${zoneSnap.size} zones already present)`);
  }

  console.log('> Checking promos ...');
  const promoSnap = await getDocs(collection(db, COLLECTIONS.PROMOS));
  if (promoSnap.empty) {
    for (const p of DEFAULT_PROMOS) {
      const { id, ...data } = p;
      await setDoc(doc(db, COLLECTIONS.PROMOS, id), data);
      promosAdded++;
    }
  } else {
    console.log(`  (skip — ${promoSnap.size} promos already present)`);
  }

  console.log('');
  console.log('✔ Seed complete');
  console.log(`  carTypes added: ${carTypesAdded}`);
  console.log(`  zones added:    ${zonesAdded}`);
  console.log(`  promos added:   ${promosAdded}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('✖ Seed failed:', err);
  process.exit(1);
});
