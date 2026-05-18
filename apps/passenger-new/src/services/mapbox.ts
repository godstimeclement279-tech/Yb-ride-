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
