import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { COLLECTIONS, type CarType } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb, getFbStorage } from './index';

type Unsubscribe = () => void;

export function subscribeCarTypes(
  callback: (types: CarType[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(collection(db, COLLECTIONS.CAR_TYPES), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    snap => {
      const types = snap.docs.map(d => ({ id: d.id, ...d.data() } as CarType));
      callback(types);
    },
    err => {
      if (import.meta.env.DEV) console.warn('subscribeCarTypes error', err);
    },
  );
}

export interface SaveCarTypeInput {
  id: string; // doc id — slug like 'standard'
  name: string;
  baseFare: number; // kobo
  pricePerKm: number; // kobo
  seats: number;
  sortOrder: number;
  isActive: boolean;
  iconUrl?: string;
}

export async function saveCarType(input: SaveCarTypeInput): Promise<void> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase not configured');
  const db = getDb()!;
  const { id, ...data } = input;
  await setDoc(doc(db, COLLECTIONS.CAR_TYPES, id), data, { merge: true });
}

export async function deleteCarType(id: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase not configured');
  const db = getDb()!;
  await deleteDoc(doc(db, COLLECTIONS.CAR_TYPES, id));
}

export async function uploadCarTypeIcon(
  carTypeId: string,
  file: File,
): Promise<string> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase not configured');
  const storage = getFbStorage()!;
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `carTypes/${carTypeId}/icon-${Date.now()}.${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
}

export async function deleteCarTypeIcon(url: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const storage = getFbStorage()!;
  // Storage URL → path conversion
  try {
    const ref = storageRef(storage, url);
    await deleteObject(ref);
  } catch {
    /* already gone */
  }
}
