import type {
  Address,
  Booking,
  CarType,
  Promo,
  SavedAddress,
  Zone,
} from '@yb/shared';
import { TEST_USERS } from '@yb/shared';

// ─── Car types (mirrors Firestore /carTypes) ────────────────────────────────

export const MOCK_CAR_TYPES: CarType[] = [
  {
    id: 'standard',
    name: 'Standard',
    baseFare: 50000,
    pricePerKm: 10000,
    seats: 4,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'premium',
    name: 'Premium',
    baseFare: 80000,
    pricePerKm: 15000,
    seats: 4,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'suv',
    name: 'SUV',
    baseFare: 100000,
    pricePerKm: 20000,
    seats: 6,
    isActive: true,
    sortOrder: 3,
  },
];

// ─── Zones (Agbor sample) ───────────────────────────────────────────────────

export const MOCK_ZONES: Zone[] = [
  {
    id: 'agbor-central',
    name: 'Agbor Central',
    polygon: [
      { latitude: 6.245, longitude: 6.190 },
      { latitude: 6.260, longitude: 6.190 },
      { latitude: 6.260, longitude: 6.205 },
      { latitude: 6.245, longitude: 6.205 },
    ],
    surcharge: 15000, // ₦150
    isActive: true,
    createdBy: TEST_USERS.ADMIN,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
];

// ─── Sample addresses around Agbor ──────────────────────────────────────────

export const MOCK_CURRENT_LOCATION: Address = {
  label: 'Current location',
  formatted: 'Old Lagos–Asaba Rd, Agbor',
  point: { latitude: 6.2486, longitude: 6.1944 },
};

export const MOCK_SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'saved-home',
    type: 'home',
    label: 'Home',
    formatted: '23 Old Lagos Rd, Agbor, Delta State',
    point: { latitude: 6.2510, longitude: 6.1980 },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
  },
  {
    id: 'saved-work',
    type: 'work',
    label: 'Work',
    formatted: 'Federal Polytechnic Agbor',
    point: { latitude: 6.2740, longitude: 6.1820 },
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
  },
];

export const MOCK_RECENT_PLACES: Address[] = [
  {
    label: 'Boji Boji Market',
    formatted: 'Boji Boji Market, Agbor',
    point: { latitude: 6.2562, longitude: 6.1990 },
  },
  {
    label: 'Eke Market',
    formatted: 'Eke Market Rd, Agbor',
    point: { latitude: 6.2620, longitude: 6.2010 },
  },
  {
    label: 'St Anthony Hospital',
    formatted: 'St Anthony Hospital, Agbor',
    point: { latitude: 6.2455, longitude: 6.2080 },
  },
  {
    label: 'Asaba (intercity)',
    formatted: 'Asaba, Delta State',
    point: { latitude: 6.1991, longitude: 6.7264 },
  },
];

// Anything you can search for in the mock LocationSearchScreen.
export const MOCK_SEARCH_INDEX: Address[] = [
  ...MOCK_SAVED_ADDRESSES,
  ...MOCK_RECENT_PLACES,
  {
    label: 'Ika South Local Government Secretariat',
    formatted: 'Ika South LGA Secretariat, Agbor',
    point: { latitude: 6.2520, longitude: 6.2030 },
  },
  {
    label: 'Lagos Park, Agbor',
    formatted: 'Lagos Motor Park, Agbor',
    point: { latitude: 6.2480, longitude: 6.1970 },
  },
  {
    label: 'Onicha-Ugbo',
    formatted: 'Onicha-Ugbo, Aniocha North',
    point: { latitude: 6.3050, longitude: 6.4380 },
  },
];

// ─── Mock past trips (for HistoryScreen + ReceiptScreen) ────────────────────

const dayMs = 1000 * 60 * 60 * 24;
const now = Date.now();

export const MOCK_PAST_BOOKINGS: Booking[] = [
  {
    id: 'trip-1',
    passengerId: TEST_USERS.PASSENGER,
    pickup: MOCK_CURRENT_LOCATION,
    dropoff: MOCK_RECENT_PLACES[0]!,
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
    driverId: 'mock-driver-aaa',
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
    id: 'trip-2',
    passengerId: TEST_USERS.PASSENGER,
    pickup: MOCK_SAVED_ADDRESSES[0]!,
    dropoff: MOCK_SAVED_ADDRESSES[1]!,
    isRoundTrip: true,
    carTypeId: 'premium',
    fare: {
      baseFare: 80000,
      distanceFare: 75000,
      zoneSurcharge: 0,
      total: 155000,
      estimatedDistanceKm: 5,
      estimatedDurationMin: 9,
      currency: 'NGN',
      carTypeId: 'premium',
      carTypeName: 'Premium',
      appliedZoneIds: [],
    },
    status: 'completed',
    driverId: 'mock-driver-bbb',
    createdAt: now - dayMs * 4,
    paidAt: now - dayMs * 4,
    assignedAt: now - dayMs * 4 + 60_000,
    startedAt: now - dayMs * 4 + 4 * 60_000,
    completedAt: now - dayMs * 4 + 25 * 60_000,
    actualDistanceKm: 5.2,
    actualDurationMin: 21,
    paymentMethod: 'card',
    ratingFromPassenger: { stars: 4, comment: 'Smooth ride', createdAt: now - dayMs * 4 + 26 * 60_000 },
  },
  {
    id: 'trip-3',
    passengerId: TEST_USERS.PASSENGER,
    pickup: MOCK_CURRENT_LOCATION,
    dropoff: MOCK_RECENT_PLACES[3]!, // Asaba
    isRoundTrip: false,
    carTypeId: 'suv',
    fare: {
      baseFare: 100000,
      distanceFare: 1100000,
      zoneSurcharge: 0,
      total: 1200000,
      estimatedDistanceKm: 55,
      estimatedDurationMin: 92,
      currency: 'NGN',
      carTypeId: 'suv',
      carTypeName: 'SUV',
      appliedZoneIds: [],
    },
    status: 'cancelled',
    cancellationReason: 'Driver took too long',
    cancelledBy: 'passenger',
    createdAt: now - dayMs * 8,
    cancelledAt: now - dayMs * 8 + 8 * 60_000,
    paymentMethod: 'card',
  },
];

// Driver info to show during an active trip / on receipts.
export interface MockDriverSummary {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicle: { make: string; model: string; plate: string; color: string };
}

export const MOCK_ACTIVE_DRIVER: MockDriverSummary = {
  id: 'mock-driver-active',
  name: 'Emeka Okafor',
  phone: '+2348012345678',
  rating: 4.9,
  vehicle: { make: 'Toyota', model: 'Corolla', plate: 'AGB-241-XL', color: 'Silver' },
};

// ETA mock per car type (seconds away from pickup).
export const MOCK_ETA_SECONDS: Record<string, number> = {
  standard: 180,
  premium: 240,
  suv: 360,
};

// ─── Promos ─────────────────────────────────────────────────────────────────

export const MOCK_PROMOS: Promo[] = [
  {
    id: 'promo-welcome',
    code: 'WELCOME50',
    kind: 'percentage',
    value: 50,
    maxDiscount: 100000, // ₦1,000 cap
    minTripAmount: 50000,
    usageLimit: 3,
    usageCount: 0,
    startsAt: now - dayMs * 30,
    expiresAt: now + dayMs * 2,
    isActive: true,
    createdBy: TEST_USERS.ADMIN,
    createdAt: now - dayMs * 30,
  },
  {
    id: 'promo-weekend',
    code: 'WEEKEND20',
    kind: 'percentage',
    value: 20,
    minTripAmount: 80000,
    usageCount: 0,
    startsAt: now - dayMs * 7,
    expiresAt: now + dayMs * 5,
    isActive: true,
    createdBy: TEST_USERS.ADMIN,
    createdAt: now - dayMs * 14,
  },
  {
    id: 'promo-loyalty',
    code: 'LOYALTY10',
    kind: 'percentage',
    value: 10,
    usageCount: 0,
    startsAt: now - dayMs * 1,
    expiresAt: now + dayMs * 30,
    isActive: true,
    createdBy: TEST_USERS.ADMIN,
    createdAt: now - dayMs * 1,
  },
];

// ─── Notifications ──────────────────────────────────────────────────────────

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  category: 'trip' | 'promo' | 'account';
  createdAt: number;
  read: boolean;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'n-1',
    title: 'Trip completed',
    body: 'Your trip to Boji Boji Market is complete. Tap to view receipt.',
    category: 'trip',
    createdAt: now - 1000 * 60 * 60 * 4,
    read: false,
  },
  {
    id: 'n-2',
    title: '50% off your next 3 rides',
    body: 'Use code WELCOME50 at checkout. Max ₦1,000 off per trip. Ends in 2 days.',
    category: 'promo',
    createdAt: now - 1000 * 60 * 60 * 26,
    read: false,
  },
  {
    id: 'n-3',
    title: 'Saved address added',
    body: 'Federal Polytechnic Agbor was saved as Work.',
    category: 'account',
    createdAt: now - 1000 * 60 * 60 * 24 * 3,
    read: true,
  },
];

// ─── Payment methods ────────────────────────────────────────────────────────

export interface MockPaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'verve';
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export const MOCK_PAYMENT_METHODS: MockPaymentMethod[] = [
  { id: 'pm-1', brand: 'visa', last4: '4242', expMonth: 8, expYear: 28, isDefault: true },
  { id: 'pm-2', brand: 'mastercard', last4: '5500', expMonth: 3, expYear: 27, isDefault: false },
];
