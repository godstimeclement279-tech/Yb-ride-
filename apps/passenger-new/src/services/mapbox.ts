// Mapbox runtime config. Public token is safe to ship in the bundle —
// Mapbox tokens are URL-restricted by domain/bundle id in the dashboard.

export const MAPBOX_PUBLIC_TOKEN =
  'pk.eyJ1IjoiY3J5c3RhbGdlZXRlZSIsImEiOiJjbXA5ZW9ucXExa3J5MnJxenkwcDBqcGhuIn0.JBsGrPj-bun1dvDpoIenEw';

export const AGBOR_CENTER = {
  longitude: 6.1975,
  latitude: 6.2535,
};

interface GeocodeResult {
  label: string;
  formatted: string;
}

export interface DirectionsResult {
  // GeoJSON LineString coordinates (lng, lat pairs) along the driving route.
  routeCoordinates: Array<[number, number]>;
  // Driving distance in metres.
  distanceM: number;
  // Driving duration in seconds.
  durationSec: number;
}

interface GeoPointLike {
  latitude: number;
  longitude: number;
}

/**
 * Mapbox Driving Directions for a 2-point route. Used to draw the polyline
 * between pickup/dropoff (or driver→pickup) and compute the live ETA.
 *
 * Returns null on any failure so callers can fall back to the straight-line
 * estimate without throwing.
 */
export async function getDrivingDirections(
  from: GeoPointLike,
  to: GeoPointLike,
): Promise<DirectionsResult | null> {
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
      `?geometries=geojson&overview=full&access_token=${MAPBOX_PUBLIC_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!route || !coords || coords.length < 2) return null;
    return {
      routeCoordinates: coords,
      distanceM: route.distance ?? 0,
      durationSec: route.duration ?? 0,
    };
  } catch {
    return null;
  }
}

export function formatEtaMinutes(durationSec: number): string {
  const min = Math.max(1, Math.round(durationSec / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem === 0 ? `${h} hr` : `${h} hr ${rem} min`;
}

/**
 * Reverse geocode lng/lat → human readable address via Mapbox Geocoding API.
 * Returns a generic fallback if the API fails or yields no result.
 */
export async function reverseGeocode(
  longitude: number,
  latitude: number,
): Promise<GeocodeResult> {
  const fallback: GeocodeResult = {
    label: 'Selected location',
    formatted: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&limit=1&types=address,poi,place,neighborhood`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      features?: Array<{ text?: string; place_name?: string }>;
    };
    const f = data.features?.[0];
    if (!f) return fallback;
    return {
      label: f.text ?? f.place_name ?? fallback.label,
      formatted: f.place_name ?? fallback.formatted,
    };
  } catch {
    return fallback;
  }
}
