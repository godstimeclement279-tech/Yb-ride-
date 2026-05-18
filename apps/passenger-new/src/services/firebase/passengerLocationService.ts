import { off, onValue, ref } from 'firebase/database';
import { FIREBASE_CONFIGURED, getRtdb } from './index';

interface DriverLocationDoc {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp?: number | object;
}

type Unsubscribe = () => void;

/**
 * Live subscription to a single driver's GPS ping. Useful for the
 * TripTracking screen so the passenger sees driver movement.
 */
export function subscribeDriverLocation(
  driverId: string,
  callback: (loc: { latitude: number; longitude: number } | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED) {
    callback(null);
    return () => {};
  }
  const rtdb = getRtdb()!;
  const r = ref(rtdb, `driver_locations/${driverId}`);
  const handler = onValue(
    r,
    snap => {
      const v = snap.val() as DriverLocationDoc | null;
      if (!v) {
        callback(null);
        return;
      }
      callback({ latitude: v.latitude, longitude: v.longitude });
    },
    err => {
      if (__DEV__) console.warn('subscribeDriverLocation error', err);
    },
  );
  return () => off(r, 'value', handler);
}
