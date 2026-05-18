import { ref, remove, serverTimestamp, set } from 'firebase/database';
import { FIREBASE_CONFIGURED, getRtdb } from './index';

interface LocationPing {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
}

/**
 * Push a location ping to RTDB at `driver_locations/{driverId}`.
 * Designed to be called every 5s by a foreground/background GPS task.
 * Safe to call repeatedly; uses set (overwrite) not push.
 */
export async function pushDriverLocation(
  driverId: string,
  ping: LocationPing,
): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const rtdb = getRtdb()!;
  await set(ref(rtdb, `driver_locations/${driverId}`), {
    driverId,
    latitude: ping.latitude,
    longitude: ping.longitude,
    heading: ping.heading ?? null,
    speed: ping.speed ?? null,
    accuracy: ping.accuracy ?? null,
    timestamp: serverTimestamp(),
  });
}

/**
 * Remove the driver's location ping. Call on going offline so the staff fleet
 * map and any passenger app subscribers stop showing them.
 */
export async function clearDriverLocation(driverId: string): Promise<void> {
  if (!FIREBASE_CONFIGURED) return;
  const rtdb = getRtdb()!;
  await remove(ref(rtdb, `driver_locations/${driverId}`));
}
