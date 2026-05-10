import { describe, expect, it } from 'vitest';
import { calculateFare } from '../pricing/calculateFare';
import type { CarType, GeoPoint, Zone } from '../types';

const STANDARD: CarType = {
  id: 'standard',
  name: 'Standard',
  baseFare: 50000,    // ₦500
  pricePerKm: 10000,  // ₦100/km
  seats: 4,
  isActive: true,
  sortOrder: 1,
};

const PREMIUM: CarType = {
  id: 'premium',
  name: 'Premium',
  baseFare: 80000,
  pricePerKm: 15000,
  seats: 4,
  isActive: true,
  sortOrder: 2,
};

// ~10 km apart
const POINT_A: GeoPoint = { latitude: 6.2486, longitude: 6.1944 };
const POINT_B: GeoPoint = { latitude: 6.3380, longitude: 6.1944 };

describe('calculateFare', () => {
  it('one-way standard trip with no zones returns base + distance fare', () => {
    const r = calculateFare({
      pickup: POINT_A,
      dropoff: POINT_B,
      carType: STANDARD,
      zones: [],
      isRoundTrip: false,
    });

    expect(r.baseFare).toBe(50000);
    expect(r.zoneSurcharge).toBe(0);
    expect(r.appliedZoneIds).toEqual([]);
    // ~10 km × ₦100/km ≈ ₦1,000 (in kobo: ~100,000)
    expect(r.distanceFare).toBeGreaterThan(95_000);
    expect(r.distanceFare).toBeLessThan(105_000);
    expect(r.total).toBe(r.baseFare + r.distanceFare);
    expect(r.estimatedDistanceKm).toBeGreaterThan(9);
    expect(r.estimatedDistanceKm).toBeLessThan(11);
    expect(r.currency).toBe('NGN');
    expect(r.carTypeId).toBe('standard');
  });

  it('round trip doubles distance fare but not base fare', () => {
    const oneWay = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [], isRoundTrip: false,
    });
    const round = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [], isRoundTrip: true,
    });

    expect(round.baseFare).toBe(oneWay.baseFare);
    // Allow ±1 kobo tolerance — distance is doubled before rounding to integer kobo,
    // so the result can differ from (oneWay × 2) by one unit.
    expect(round.distanceFare).toBeGreaterThanOrEqual(oneWay.distanceFare * 2 - 1);
    expect(round.distanceFare).toBeLessThanOrEqual(oneWay.distanceFare * 2 + 1);
    expect(round.estimatedDistanceKm).toBeCloseTo(oneWay.estimatedDistanceKm * 2, 1);
  });

  it('premium tier costs more than standard for same trip', () => {
    const std = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [], isRoundTrip: false,
    });
    const prem = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: PREMIUM, zones: [], isRoundTrip: false,
    });

    expect(prem.total).toBeGreaterThan(std.total);
    expect(prem.baseFare).toBe(80000);
  });

  it('applies surcharge when pickup falls inside an active zone', () => {
    const zone: Zone = {
      id: 'agbor-central',
      name: 'Agbor Central',
      polygon: [
        { latitude: 6.24, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.20 },
        { latitude: 6.24, longitude: 6.20 },
      ],
      surcharge: 20000,
      isActive: true,
      createdBy: 'admin',
      createdAt: 0,
    };

    const r = calculateFare({
      pickup: POINT_A,    // inside zone
      dropoff: POINT_B,   // outside
      carType: STANDARD,
      zones: [zone],
      isRoundTrip: false,
    });

    expect(r.zoneSurcharge).toBe(20000);
    expect(r.appliedZoneIds).toEqual(['agbor-central']);
    expect(r.total).toBe(r.baseFare + r.distanceFare + 20000);
  });

  it('stacks surcharges from multiple zones if both pickup and dropoff trigger', () => {
    const zoneA: Zone = {
      id: 'zone-a',
      name: 'A',
      polygon: [
        { latitude: 6.24, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.20 },
        { latitude: 6.24, longitude: 6.20 },
      ],
      surcharge: 20000,
      isActive: true,
      createdBy: 'admin',
      createdAt: 0,
    };
    const zoneB: Zone = {
      id: 'zone-b',
      name: 'B',
      polygon: [
        { latitude: 6.32, longitude: 6.18 },
        { latitude: 6.35, longitude: 6.18 },
        { latitude: 6.35, longitude: 6.21 },
        { latitude: 6.32, longitude: 6.21 },
      ],
      surcharge: 15000,
      isActive: true,
      createdBy: 'admin',
      createdAt: 0,
    };

    const r = calculateFare({
      pickup: POINT_A,    // in zoneA
      dropoff: POINT_B,   // in zoneB
      carType: STANDARD,
      zones: [zoneA, zoneB],
      isRoundTrip: false,
    });

    expect(r.zoneSurcharge).toBe(35000);
    expect(r.appliedZoneIds.sort()).toEqual(['zone-a', 'zone-b']);
  });

  it('ignores inactive zones', () => {
    const zone: Zone = {
      id: 'inactive',
      name: 'Inactive',
      polygon: [
        { latitude: 6.24, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.20 },
        { latitude: 6.24, longitude: 6.20 },
      ],
      surcharge: 50000,
      isActive: false,
      createdBy: 'admin',
      createdAt: 0,
    };

    const r = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [zone], isRoundTrip: false,
    });
    expect(r.zoneSurcharge).toBe(0);
    expect(r.appliedZoneIds).toEqual([]);
  });

  it('returns integer kobo totals (no float drift)', () => {
    const r = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [], isRoundTrip: false,
    });
    expect(Number.isInteger(r.baseFare)).toBe(true);
    expect(Number.isInteger(r.distanceFare)).toBe(true);
    expect(Number.isInteger(r.zoneSurcharge)).toBe(true);
    expect(Number.isInteger(r.total)).toBe(true);
  });

  it('ETA scales with distance (round trip > one way)', () => {
    const oneWay = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [], isRoundTrip: false,
    });
    const round = calculateFare({
      pickup: POINT_A, dropoff: POINT_B, carType: STANDARD, zones: [], isRoundTrip: true,
    });
    expect(round.estimatedDurationMin).toBeGreaterThan(oneWay.estimatedDurationMin);
  });
});
