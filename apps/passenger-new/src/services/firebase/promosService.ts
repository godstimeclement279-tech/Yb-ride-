import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { COLLECTIONS, type Promo } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';
import { MOCK_PROMOS } from '../../data/mockData';

type Unsubscribe = () => void;

export function subscribePromos(callback: (promos: Promo[]) => void): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(MOCK_PROMOS);
    return () => {};
  }
  const db = getDb()!;
  const q = query(collection(db, COLLECTIONS.PROMOS), where('isActive', '==', true));
  return onSnapshot(
    q,
    snap => {
      const promos = snap.docs.map(d => ({ id: d.id, ...d.data() } as Promo));
      callback(promos);
    },
    err => {
      if (__DEV__) console.warn('subscribePromos error', err);
    },
  );
}
