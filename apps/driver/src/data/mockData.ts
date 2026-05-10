import type {
  Address,
  Booking,
  Driver,
  GeoPoint,
} from '@yb/shared';
import { TEST_USERS } from '@yb/shared';

const dayMs = 1000 * 60 * 60 * 24;
const now = Date.now();

// ─── Addresses around Agbor (mock GPS targets) ─────────────────────────────

export const MOCK_DRIVER_LOCATION: GeoPoint = {
  latitude: 6.2486,
  longitude: 6.1944,
};

const ADDR_BOJI: Address = {
  label: 'Boji Boji Market',
  formatted: 'Boji Boji Market, Agbor',
  point: { latitude: 6.2562, longitude: 6.1990 },
};

const ADDR_HOME: Address = {
  label: '23 Old Lagos Rd',
  formatted: '23 Old Lagos Rd, Agbor, Delta',
  point: { latitude: 6.2510, longitude: 6.1980 },
};

const ADDR_POLY: Address = {
  label: 'Federal Polytechnic Agbor',
  formatted: 'Federal Polytechnic Agbor',
  point: { latitude: 6.2740, longitude: 6.1820 },
};

const ADDR_HOSPITAL: Address = {
  label: 'St Anthony Hospital',
  formatted: 'St Anthony Hospital, Agbor',
  point: { latitude: 6.2455, longitude: 6.2080 },
};

const ADDR_EKE: Address = {
  label: 'Eke Market',
  formatted: 'Eke Market Rd, Agbor',
  point: { latitude: 6.2620, longitude: 6.2010 },
};

// ─── Test driver (admin-created in real flow) ──────────────────────────────

export const MOCK_DRIVER: Driver = {
  id: TEST_USERS.DRIVER,
  role: 'driver',
  name: 'Emeka Okafor',
  phone: '+2348012345678',
  email: 'emeka@yb-ride.test',
  isActive: true,
  status: 'offline',
  carTypeId: 'standard',
  vehicle: {
    make: 'Toyota',
    model: 'Corolla',
    year: 2018,
    plate: 'AGB-241-XL',
    color: 'Silver',
  },
  documents: {
    licenseUrl: undefined,
    vehiclePapersUrl: undefined,
    insuranceUrl: undefined,
    uploadedAt: now - dayMs * 30,
    verifiedAt: now - dayMs * 25,
    verifiedBy: TEST_USERS.ADMIN,
  },
  totalTrips: 142,
  totalEarningsKobo: 32_45_000, // ~₦32,450
  averageRating: 4.8,
  approvedAt: now - dayMs * 60,
  approvedBy: TEST_USERS.ADMIN,
  lastKnownLocation: MOCK_DRIVER_LOCATION,
  lastLocationUpdate: now,
  createdAt: now - dayMs * 90,
  updatedAt: now,
};

// ─── Pending assigned trip (staff-assigned, awaiting driver action) ────────

export const MOCK_ASSIGNED_BOOKING: Booking = {
  id: 'trip-assigned-1',
  passengerId: TEST_USERS.PASSENGER,
  pickup: ADDR_BOJI,
  dropoff: ADDR_POLY,
  isRoundTrip: false,
  carTypeId: 'standard',
  fare: {
    baseFare: 50000,
    distanceFare: 25000,
    zoneSurcharge: 15000,
    total: 90000,
    estimatedDistanceKm: 2.5,
    estimatedDurationMin: 9,
    currency: 'NGN',
    carTypeId: 'standard',
    carTypeName: 'Standard',
    appliedZoneIds: ['agbor-central'],
  },
  status: 'assigned',
  driverId: TEST_USERS.DRIVER,
  staffAssignedBy: TEST_USERS.STAFF,
  createdAt: now - 12 * 60_000,
  paidAt: now - 11 * 60_000,
  assignedAt: now - 60_000,
  paymentMethod: 'card',
};

// Mock passenger summary for active trip cards.
export interface MockPassengerSummary {
  id: string;
  name: string;
  phone: string;
  rating: number;
}

export const MOCK_ACTIVE_PASSENGER: MockPassengerSummary = {
  id: TEST_USERS.PASSENGER,
  name: 'Chioma A.',
  phone: '+2348091234567',
  rating: 4.9,
};

// ─── Past trips (history) ───────────────────────────────────────────────────

export const MOCK_PAST_BOOKINGS: Booking[] = [
  {
    id: 'trip-d-1',
    passengerId: TEST_USERS.PASSENGER,
    pickup: ADDR_HOME,
    dropoff: ADDR_BOJI,
    isRoundTrip: false,
    carTypeId: 'standard',
    fare: {
      baseFare: 50000,
      distanceFare: 8000,
      zoneSurcharge: 15000,
      total: 73000,
      estimatedDistanceKm: 0.8,
      estimatedDurationMin: 4,
      currency: 'NGN',
      carTypeId: 'standard',
      carTypeName: 'Standard',
      appliedZoneIds: ['agbor-central'],
    },
    status: 'completed',
    driverId: TEST_USERS.DRIVER,
    createdAt: now - dayMs * 1,
    paidAt: now - dayMs * 1,
    assignedAt: now - dayMs * 1 + 60_000,
    startedAt: now - dayMs * 1 + 5 * 60_000,
    completedAt: now - dayMs * 1 + 12 * 60_000,
    actualDistanceKm: 0.9,
    actualDurationMin: 7,
    paymentMethod: 'card',
    ratingFromPassenger: { stars: 5, createdAt: now - dayMs * 1 + 13 * 60_000 },
  },
  {
    id: 'trip-d-2',
    passengerId: TEST_USERS.PASSENGER,
    pickup: ADDR_POLY,
    dropoff: ADDR_HOSPITAL,
    isRoundTrip: false,
    carTypeId: 'premium',
    fare: {
      baseFare: 80000,
      distanceFare: 60000,
      zoneSurcharge: 0,
      total: 140000,
      estimatedDistanceKm: 4,
      estimatedDurationMin: 10,
      currency: 'NGN',
      carTypeId: 'premium',
      carTypeName: 'Premium',
      appliedZoneIds: [],
    },
    status: 'completed',
    driverId: TEST_USERS.DRIVER,
    createdAt: now - dayMs * 2,
    paidAt: now - dayMs * 2,
    assignedAt: now - dayMs * 2 + 60_000,
    startedAt: now - dayMs * 2 + 4 * 60_000,
    completedAt: now - dayMs * 2 + 18 * 60_000,
    actualDistanceKm: 4.1,
    actualDurationMin: 14,
    paymentMethod: 'card',
    ratingFromPassenger: { stars: 5, comment: 'Smooth ride', createdAt: now - dayMs * 2 + 19 * 60_000 },
  },
  {
    id: 'trip-d-3',
    passengerId: TEST_USERS.PASSENGER,
    pickup: ADDR_EKE,
    dropoff: ADDR_HOME,
    isRoundTrip: true,
    carTypeId: 'standard',
    fare: {
      baseFare: 50000,
      distanceFare: 30000,
      zoneSurcharge: 15000,
      total: 95000,
      estimatedDistanceKm: 3,
      estimatedDurationMin: 8,
      currency: 'NGN',
      carTypeId: 'standard',
      carTypeName: 'Standard',
      appliedZoneIds: ['agbor-central'],
    },
    status: 'cancelled',
    driverId: TEST_USERS.DRIVER,
    cancellationReason: 'Passenger no-show',
    cancelledBy: 'driver',
    createdAt: now - dayMs * 3,
    cancelledAt: now - dayMs * 3 + 8 * 60_000,
    paymentMethod: 'card',
  },
  {
    id: 'trip-d-4',
    passengerId: TEST_USERS.PASSENGER,
    pickup: ADDR_HOME,
    dropoff: ADDR_POLY,
    isRoundTrip: false,
    carTypeId: 'suv',
    fare: {
      baseFare: 100000,
      distanceFare: 50000,
      zoneSurcharge: 0,
      total: 150000,
      estimatedDistanceKm: 2.5,
      estimatedDurationMin: 8,
      currency: 'NGN',
      carTypeId: 'suv',
      carTypeName: 'SUV',
      appliedZoneIds: [],
    },
    status: 'completed',
    driverId: TEST_USERS.DRIVER,
    createdAt: now - dayMs * 5,
    paidAt: now - dayMs * 5,
    assignedAt: now - dayMs * 5 + 60_000,
    startedAt: now - dayMs * 5 + 5 * 60_000,
    completedAt: now - dayMs * 5 + 14 * 60_000,
    actualDistanceKm: 2.7,
    actualDurationMin: 11,
    paymentMethod: 'bank_transfer',
    ratingFromPassenger: { stars: 4, createdAt: now - dayMs * 5 + 15 * 60_000 },
  },
];

// Earnings summary (mock — derived from completed trips for a real impl).
export const MOCK_EARNINGS = {
  todayKobo: 73000,
  todayTrips: 1,
  weekKobo: 363000,
  weekTrips: 4,
  totalKobo: 32_45_000,
  totalTrips: 142,
};
