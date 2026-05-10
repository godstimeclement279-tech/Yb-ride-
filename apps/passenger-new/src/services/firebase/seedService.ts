import {
  addDoc,
  collection,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import {
  COLLECTIONS,
  DEFAULT_CAR_TYPES,
  TEST_USERS,
} from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

export interface SeedResult {
  carTypesAdded: number;
  zonesAdded: number;
  alreadySeeded: boolean;
}

/**
 * Idempotent first-run seed: writes the 3 default car types and one sample
 * Agbor Central zone if those collections are empty. Safe to call repeatedly.
 */
export async function seedDefaults(): Promise<SeedResult> {
  if (!FIREBASE_CONFIGURED) {
    throw new Error(
      'Firebase not configured — paste your config in src/services/firebase/config.ts',
    );
  }
  const db = getDb()!;
  let carTypesAdded = 0;
  let zonesAdded = 0;
  let alreadySeeded = true;

  // Car types — predictable doc ids for easy reference (standard / premium / suv).
  const carTypesCol = collection(db, COLLECTIONS.CAR_TYPES);
  const carTypesSnap = await getDocs(carTypesCol);
  if (carTypesSnap.empty) {
    alreadySeeded = false;
    for (const ct of DEFAULT_CAR_TYPES) {
      const id = ct.name.toLowerCase();
      await setDoc(doc(db, COLLECTIONS.CAR_TYPES, id), {
        name: ct.name,
        baseFare: ct.baseFare,
        pricePerKm: ct.pricePerKm,
        seats: ct.seats,
        isActive: true,
        sortOrder: ct.sortOrder,
      });
      carTypesAdded++;
    }
  }

  // Sample zone — Agbor Central with ₦150 surcharge.
  const zonesCol = collection(db, COLLECTIONS.ZONES);
  const zonesSnap = await getDocs(zonesCol);
  if (zonesSnap.empty) {
    alreadySeeded = false;
    await addDoc(zonesCol, {
      name: 'Agbor Central',
      polygon: [
        { latitude: 6.245, longitude: 6.190 },
        { latitude: 6.260, longitude: 6.190 },
        { latitude: 6.260, longitude: 6.205 },
        { latitude: 6.245, longitude: 6.205 },
      ],
      surcharge: 15000,
      isActive: true,
      createdBy: TEST_USERS.ADMIN,
      createdAt: Date.now(),
    });
    zonesAdded++;
  }

  return { carTypesAdded, zonesAdded, alreadySeeded };
}
