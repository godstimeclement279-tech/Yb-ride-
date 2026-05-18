import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { pushDriverLocation } from './firebase/driverLocationsService';

// ─── Background GPS pipeline ───────────────────────────────────────────────
// Driver app pushes GPS to Realtime Database every 5 seconds (configurable
// in firebase/shared constants). Foreground updates run via watchPositionAsync
// from TripContext. Background updates use TaskManager + Location's native
// background updates API so pings keep flowing while the app is minimized.
//
// The native task callback runs in a fresh JS context that doesn't see React
// state, so we persist the active driverId in AsyncStorage and the task reads
// it back on each ping.

export const BG_LOCATION_TASK = 'yb-driver-bg-location';
const STORAGE_KEY_DRIVER_ID = 'yb-driver:active-driver-id';

interface LocationTaskPayload {
  locations: Location.LocationObject[];
}

// ─── AsyncStorage helpers ─────────────────────────────────────────────────

export async function persistActiveDriverId(driverId: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_DRIVER_ID, driverId);
}

export async function clearActiveDriverId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_DRIVER_ID);
}

async function loadActiveDriverId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY_DRIVER_ID);
}

// ─── Task definition (must run at module load, before app code starts) ────

if (Platform.OS !== 'web') {
  // defineTask is idempotent — safe to call on every JS reload.
  TaskManager.defineTask(BG_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      if (__DEV__) console.warn('[bg-location] task error', error);
      return;
    }
    if (!data) return;
    const { locations } = data as LocationTaskPayload;
    if (!locations || locations.length === 0) return;

    const driverId = await loadActiveDriverId();
    if (!driverId) return;

    // Push only the latest ping — Realtime Database write cost is per-update,
    // and stale intermediate samples are noise for live tracking.
    const last = locations[locations.length - 1]!;
    try {
      await pushDriverLocation(driverId, {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
        heading: last.coords.heading,
        speed: last.coords.speed,
        accuracy: last.coords.accuracy,
      });
    } catch (err) {
      if (__DEV__) console.warn('[bg-location] push error', err);
    }
  });
}

// ─── Start / stop helpers (called from TripContext) ───────────────────────

export async function startBackgroundLocation(driverId: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  // Foreground permission must already be granted by the caller. Background
  // requires its own "Always" prompt on iOS, "Allow all the time" on Android.
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    if (__DEV__) console.warn('[bg-location] foreground permission missing');
    return false;
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    if (__DEV__) console.warn('[bg-location] background permission denied');
    return false;
  }

  await persistActiveDriverId(driverId);

  // Avoid duplicate registration if the task is already streaming.
  const already = await Location.hasStartedLocationUpdatesAsync(BG_LOCATION_TASK);
  if (already) return true;

  await Location.startLocationUpdatesAsync(BG_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 5_000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'YB Ride is sharing your live location',
      notificationBody:
        'Passengers and dispatch can see your position while you are online.',
      notificationColor: '#1E3A8A',
    },
  });
  return true;
}

export async function stopBackgroundLocation(): Promise<void> {
  if (Platform.OS === 'web') return;
  const running = await Location.hasStartedLocationUpdatesAsync(BG_LOCATION_TASK);
  if (running) {
    await Location.stopLocationUpdatesAsync(BG_LOCATION_TASK);
  }
  await clearActiveDriverId();
}
