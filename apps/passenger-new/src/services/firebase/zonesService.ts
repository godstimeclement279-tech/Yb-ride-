import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { COLLECTIONS, type Zone } from '@yb/shared';
import { FIREBASE_CONFIGURED, getDb } from './index';
import { MOCK_ZONES } from '../../data/mockData';

type Unsubscribe = () => void;

export function subscribeZones(
  callback: (zones: Zone[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(MOCK_ZONES);
    return () => {};
  }
  const q = query(
    collection(getDb()!, COLLECTIONS.ZONES),
    where('isActive', '==', true),
  );
  return onSnapshot(
    q,
    snap => {
      const zones = snap.docs.map(d => ({ id: d.id, ...d.data() } as Zone));
      callback(zones);
    },
    err => {
      if (__DEV__) console.warn('subscribeZones error', err);
    },
  );
}
