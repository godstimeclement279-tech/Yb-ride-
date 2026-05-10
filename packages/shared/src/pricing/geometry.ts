import type { GeoPoint } from '../types';

// Ray-casting point-in-polygon. Treats the polygon as planar (lat/lon as y/x).
// Accurate enough for city-scale zones; not for polygons that span hundreds of km.
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (polygon.length < 3) return false;

  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const vi = polygon[i]!;
    const vj = polygon[j]!;
    const xi = vi.longitude;
    const yi = vi.latitude;
    const xj = vj.longitude;
    const yj = vj.latitude;

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}
