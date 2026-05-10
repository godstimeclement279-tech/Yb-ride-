import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { COLLECTIONS, type CarType } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';
import { MOCK_CAR_TYPES } from '../../data/mockData';

type Unsubscribe = () => void;

export function subscribeCarTypes(
  callback: (types: CarType[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(MOCK_CAR_TYPES);
    return () => {};
  }
  const db = getDb()!;
  const q = query(
    collection(db, COLLECTIONS.CAR_TYPES),
    where('isActive', '==', true),
    orderBy('sortOrder', 'asc'),
  );
  return onSnapshot(
    q,
    snap => {
      const types = snap.docs.map(
        d => ({ id: d.id, ...d.data() } as CarType),
      );
      callback(types);
    },
    err => {
      // On error keep showing whatever we had before. Surface in __DEV__ console.
      if (__DEV__) console.warn('subscribeCarTypes error', err);
    },
  );
}
