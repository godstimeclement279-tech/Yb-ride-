// Google Maps Platform — Places (New) + Geocoding APIs.
//
// Used ONLY for place search + reverse geocoding because Mapbox's OSM data
// has thin coverage of Agbor POIs and was returning either far-away matches
// (Abuja/Lagos) or no matches at all for landmarks people know locally.
// Map TILES still come from Mapbox via @rnmapbox/maps — switching tiles
// would require a native rebuild and the rnmapbox patch we already shipped.
//
// Key restrictions: "Application restrictions = None" + "API restrictions =
// Places API (New) + Geocoding API". HTTP-referer / Android-app restrictions
// don't work for plain `fetch` from React Native — Android-cert checks need
// the Maps Android SDK, and there's no Referer header on RN fetch. Move the
// key to a server-side proxy (Cloud Function) before production if leakage
// is a concern; for now the API-restriction caps the blast radius.

import { AGBOR_CENTER } from './mapbox';

const GOOGLE_MAPS_API_KEY = 'AIzaSyB4diRGz6N5lrT3Zu_IsgOgtx9sfcc6VI0';

export interface PlaceResult {
  label: string;
  formatted: string;
  point: { latitude: number; longitude: number };
  placeId?: string;
}

export interface GeocodeResult {
  label: string;
  formatted: string;
}

/**
 * Forward search via Places API (New) Text Search. Biased to a 50km circle
 * around Agbor + restricted to Nigeria. Returns [] on any failure so the
 * caller can render "no matches" instead of throwing.
 */
// Wrap a fetch in a hard timeout so a hung request can't pile up forever
// on flaky cellular. 8s is enough for a healthy round-trip, short enough to
// fall back to a different endpoint when this one is starved.
function fetchWithTimeout(input: RequestInfo, init: RequestInit, ms = 8000): Promise<Response> {
  return Promise.race([
    fetch(input, init),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);
}

async function searchViaPlaces(q: string): Promise<PlaceResult[]> {
  const t0 = Date.now();
  try {
    const res = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.location,places.id',
        },
        body: JSON.stringify({
          textQuery: q,
          languageCode: 'en',
          regionCode: 'NG',
          locationBias: {
            circle: {
              center: {
                latitude: AGBOR_CENTER.latitude,
                longitude: AGBOR_CENTER.longitude,
              },
              radius: 50000,
            },
          },
        }),
      },
    );
    console.log('[gplaces:new] status', res.status, 'in', Date.now() - t0, 'ms');
    if (!res.ok) return [];
    const data = (await res.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
      }>;
    };
    return (data.places ?? [])
      .filter(
        (p) =>
          typeof p.location?.latitude === 'number' &&
          typeof p.location?.longitude === 'number',
      )
      .map((p) => ({
        label: p.displayName?.text ?? p.formattedAddress ?? 'Unknown place',
        formatted: p.formattedAddress ?? p.displayName?.text ?? '',
        point: {
          latitude: p.location!.latitude!,
          longitude: p.location!.longitude!,
        },
        placeId: p.id,
      }));
  } catch (e) {
    console.log('[gplaces:new] FAILED ->', String(e), 'after', Date.now() - t0, 'ms');
    return [];
  }
}

async function searchViaGeocoding(q: string): Promise<PlaceResult[]> {
  const t0 = Date.now();
  try {
    // Geocoding API (legacy maps.googleapis.com host). GET request, simpler
    // transport. Less rich than Places — primarily returns addresses + named
    // places that Google has geocoded — but more reliable when Places hangs.
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(q)}` +
      `&components=country:NG` +
      `&bounds=5.5,5.5|7.0,7.0` +
      `&language=en` +
      `&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetchWithTimeout(url, {});
    console.log('[gplaces:geo] status', res.status, 'in', Date.now() - t0, 'ms');
    if (!res.ok) return [];
    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        place_id?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
        address_components?: Array<{ long_name?: string }>;
      }>;
    };
    if (data.status !== 'OK') return [];
    return (data.results ?? [])
      .filter(
        (r) =>
          typeof r.geometry?.location?.lat === 'number' &&
          typeof r.geometry?.location?.lng === 'number',
      )
      .map((r) => {
        const formatted = r.formatted_address ?? '';
        return {
          label: r.address_components?.[0]?.long_name ?? formatted.split(',')[0] ?? formatted,
          formatted,
          point: {
            latitude: r.geometry!.location!.lat!,
            longitude: r.geometry!.location!.lng!,
          },
          placeId: r.place_id,
        };
      });
  } catch (e) {
    console.log('[gplaces:geo] FAILED ->', String(e), 'after', Date.now() - t0, 'ms');
    return [];
  }
}

/**
 * Search with fallback: Places API (New) gives richer POI results but its
 * host (`places.googleapis.com`) sometimes hangs in JS fetch on flaky
 * cellular even when tiles render fine. Geocoding API (`maps.googleapis.com`)
 * is a different host with a simpler GET endpoint and tends to come through
 * when Places doesn't. We try Places first; if it returns 0 results in the
 * timeout window we fall back to Geocoding so the user still gets matches.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  console.log('[gplaces] start q=', q);
  const places = await searchViaPlaces(q);
  if (places.length > 0) return places;
  console.log('[gplaces] places empty/failed → falling back to geocoding');
  return await searchViaGeocoding(q);
}

/**
 * Reverse geocode coords → human readable address via Google Geocoding API.
 * Falls back to a coord string if the request fails so the UI never shows
 * blank.
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
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${latitude},${longitude}` +
      `&language=en` +
      `&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{ long_name?: string; types?: string[] }>;
      }>;
    };
    if (data.status !== 'OK') return fallback;
    // Prefer the first street-address / route / premise / point_of_interest
    // result; fall back to the first result of any kind.
    const preferred =
      data.results?.find((r) =>
        r.address_components?.some((c) =>
          c.types?.some((t) =>
            ['route', 'street_address', 'premise', 'point_of_interest'].includes(t),
          ),
        ),
      ) ?? data.results?.[0];
    if (!preferred?.formatted_address) return fallback;
    // Short label = first comma-separated chunk of the formatted address.
    const formatted = preferred.formatted_address;
    const label = formatted.split(',')[0]?.trim() || formatted;
    return { label, formatted };
  } catch {
    return fallback;
  }
}
