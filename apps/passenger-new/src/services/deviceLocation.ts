// Real device GPS via expo-location. Wrapped in lazy require + try/catch so
// a missing native module (e.g. before the next EAS build lands the
// expo-location native binary) degrades gracefully to "no location" instead
// of crashing the JS bundle on import.

export interface DeviceLocation {
  latitude: number;
  longitude: number;
}

interface ExpoLocationLike {
  requestForegroundPermissionsAsync: () => Promise<{ status: string }>;
  getCurrentPositionAsync: (opts?: { accuracy?: number }) => Promise<{
    coords: { latitude: number; longitude: number };
  }>;
  Accuracy?: { Balanced: number };
}

function tryLoad(): ExpoLocationLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-location') as ExpoLocationLike;
  } catch {
    return null;
  }
}

/**
 * Ask for foreground location permission, then read one GPS fix. Returns
 * null if the module is missing, the user denied, or the device couldn't
 * acquire a fix. Callers should fall back to a sensible default location
 * (e.g. AGBOR_CENTER) when null.
 */
export async function getCurrentDeviceLocation(): Promise<DeviceLocation | null> {
  const Location = tryLoad();
  if (!Location) return null;
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy?.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}
