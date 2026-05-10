import type { CarType, FareBreakdown, GeoPoint, Zone } from '../types';
import { haversineKm } from './haversine';
import { isPointInPolygon } from './geometry';

const URBAN_AVERAGE_SPEED_KMH = 36;

export interface CalculateFareInput {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  carType: CarType;
  zones: Zone[];
  isRoundTrip: boolean;
}

export function calculateFare(input: CalculateFareInput): FareBreakdown {
  const { pickup, dropoff, carType, zones, isRoundTrip } = input;

  const oneWayKm = haversineKm(pickup, dropoff);
  const distanceKm = isRoundTrip ? oneWayKm * 2 : oneWayKm;

  const distanceFare = Math.round(distanceKm * carType.pricePerKm);

  const appliedZones = zones.filter(
    z =>
      z.isActive &&
      (isPointInPolygon(pickup, z.polygon) ||
        isPointInPolygon(dropoff, z.polygon)),
  );

  const zoneSurcharge = appliedZones.reduce((sum, z) => sum + z.surcharge, 0);

  const total = carType.baseFare + distanceFare + zoneSurcharge;

  const estimatedDurationMin = Math.max(
    1,
    Math.round((distanceKm / URBAN_AVERAGE_SPEED_KMH) * 60),
  );

  return {
    baseFare: carType.baseFare,
    distanceFare,
    zoneSurcharge,
    total,
    estimatedDistanceKm: Math.round(distanceKm * 100) / 100,
    estimatedDurationMin,
    currency: 'NGN',
    carTypeId: carType.id,
    carTypeName: carType.name,
    appliedZoneIds: appliedZones.map(z => z.id),
  };
}
