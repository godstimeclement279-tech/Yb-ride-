// Single source of truth for collection paths, status enums, and seed data.

export const COLLECTIONS = {
  USERS: 'users',
  DRIVERS: 'drivers',
  STAFF: 'staff',
  CAR_TYPES: 'carTypes',
  ZONES: 'zones',
  BOOKINGS: 'bookings',
  PROMOS: 'promos',
  RATINGS: 'ratings',
} as const;

export const RTDB_PATHS = {
  DRIVER_LOCATIONS: 'driver_locations',
} as const;

// Hardcoded test users for the no-auth MVP. Replace with Firebase Auth UIDs
// when authentication ships.
export const TEST_USERS = {
  PASSENGER: 'test-user-123',
  DRIVER: 'test-driver-123',
  STAFF: 'test-staff-123',
  ADMIN: 'test-admin-123',
} as const;

export const FIREBASE_REGION = 'europe-west1';

// Initial car types seeded into Firestore. Admin can add/edit at runtime.
export const DEFAULT_CAR_TYPES = [
  {
    name: 'Standard',
    baseFare: 50000,      // ₦500
    pricePerKm: 10000,    // ₦100/km
    seats: 4,
    sortOrder: 1,
  },
  {
    name: 'Premium',
    baseFare: 80000,      // ₦800
    pricePerKm: 15000,    // ₦150/km
    seats: 4,
    sortOrder: 2,
  },
  {
    name: 'SUV',
    baseFare: 100000,     // ₦1,000
    pricePerKm: 20000,    // ₦200/km
    seats: 6,
    sortOrder: 3,
  },
] as const;

// Driver location push frequency
export const DRIVER_LOCATION_PUSH_INTERVAL_MS = 5_000;

// Booking lifecycle ordering — used for sorting / state machine guards.
export const BOOKING_STATUS_ORDER = [
  'pending_payment',
  'paid',
  'assigned',
  'driver_arrived',
  'in_progress',
  'completed',
  'cancelled',
] as const;
