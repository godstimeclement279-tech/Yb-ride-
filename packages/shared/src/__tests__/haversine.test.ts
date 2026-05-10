import { describe, expect, it } from 'vitest';
import { haversineKm } from '../pricing/haversine';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    const p = { latitude: 6.2486, longitude: 6.1944 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it('is symmetric', () => {
    const a = { latitude: 6.2486, longitude: 6.1944 };
    const b = { latitude: 6.3380, longitude: 6.1944 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });

  it('matches a known short distance (Agbor sample, ~10 km north)', () => {
    const a = { latitude: 6.2486, longitude: 6.1944 };
    const b = { latitude: 6.3380, longitude: 6.1944 };
    const km = haversineKm(a, b);
    expect(km).toBeGreaterThan(9.5);
    expect(km).toBeLessThan(10.5);
  });

  it('matches a known long distance (Lagos to Abuja, ~530 km)', () => {
    const lagos = { latitude: 6.5244, longitude: 3.3792 };
    const abuja = { latitude: 9.0765, longitude: 7.3986 };
    const km = haversineKm(lagos, abuja);
    expect(km).toBeGreaterThan(520);
    expect(km).toBeLessThan(540);
  });
});
