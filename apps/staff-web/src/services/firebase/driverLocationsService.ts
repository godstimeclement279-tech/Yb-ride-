import { onValue, ref } from 'firebase/database';
import { type DriverLocationDoc, RTDB_PATHS } from '@yb/shared';
import { FIREBASE_CONFIGURED, getRtdb } from './index';

type Unsubscribe = () => void;

/**
 * Subscribe to the entire fleet's live GPS feed. Returns an object keyed by
 * driverId so the Fleet map can keep a stable marker-per-driver state.
 */
export function subscribeFleetLocations(
  callback: (byDriverId: Record<string, DriverLocationDoc>) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback({});
    return () => {};
  }
  const r = ref(getRtdb()!, RTDB_PATHS.DRIVER_LOCATIONS);
  return onValue(
    r,
    (snap) => {
      callback((snap.val() as Record<string, DriverLocationDoc>) ?? {});
    },
    (err) => import.meta.env.DEV && console.warn('subscribeFleetLocations error', err),
  );
}

export function subscribeDriverLocation(
  driverId: string,
  callback: (loc: DriverLocationDoc | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const r = ref(getRtdb()!, `${RTDB_PATHS.DRIVER_LOCATIONS}/${driverId}`);
  return onValue(
    r,
    (snap) => callback(snap.exists() ? (snap.val() as DriverLocationDoc) : null),
    (err) => import.meta.env.DEV && console.warn('subscribeDriverLocation error', err),
  );
}
