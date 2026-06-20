import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { COLLECTIONS, type Promo } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';

type Unsubscribe = () => void;

export function subscribePromos(callback: (promos: Promo[]) => void): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback([]);
    return () => {};
  }
  const db = getDb()!;
  const q = query(collection(db, COLLECTIONS.PROMOS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snap => {
      const promos = snap.docs.map(d => ({ id: d.id, ...d.data() } as Promo));
      callback(promos);
    },
    err => {
      if (import.meta.env.DEV) console.warn('subscribePromos error', err);
    },
  );
}

export interface SavePromoInput {
  id: string; // doc id — same as code, uppercase
  code: string;
  kind: 'percentage' | 'fixed';
  value: number; // percent or kobo
  maxDiscount?: number; // kobo
  minTripAmount?: number; // kobo
  usageLimit?: number;
  usageCount: number;
  startsAt: number;
  expiresAt: number;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
}

export async function savePromo(input: SavePromoInput): Promise<void> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase not configured');
  const db = getDb()!;
  const { id, ...data } = input;
  await setDoc(doc(db, COLLECTIONS.PROMOS, id), data, { merge: true });
}

export async function deletePromo(id: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) throw new Error('Firebase not configured');
  const db = getDb()!;
  await deleteDoc(doc(db, COLLECTIONS.PROMOS, id));
}
