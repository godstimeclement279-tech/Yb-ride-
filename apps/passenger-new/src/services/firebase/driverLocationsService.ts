import { onValue, ref } from 'firebase/database';
import { type DriverLocationDoc, RTDB_PATHS } from '@yb/shared';
import { FIREBASE_CONFIGURED, getRtdb } from './index';

type Unsubscribe = () => void;

export function subscribeDriverLocation(
  driverId: string,
  callback: (loc: DriverLocationDoc | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const r = ref(
    getRtdb()!,
    `${RTDB_PATHS.DRIVER_LOCATIONS}/${driverId}`,
  );
  return onValue(
    r,
    snap => callback(snap.exists() ? (snap.val() as DriverLocationDoc) : null),
    err => {
      if (__DEV__) console.warn('subscribeDriverLocation error', err);
    },
  );
}
