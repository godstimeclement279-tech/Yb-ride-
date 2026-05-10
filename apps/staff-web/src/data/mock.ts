// Subset of mock data — staff sees bookings, drivers, fleet locations, but
// not configuration objects (zones, promos, etc., which are admin-only).
//
// Used as a fallback when Firebase isn't configured so the UI is fully
// previewable in dev without a backend.

import type {
  Booking,
  Driver,
  DriverLocationDoc,
  Passenger,
  Staff,
} from '@yb/shared';

const now = Date.now();
const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

// ─── Staff (admin-created) ──────────────────────────────────────────────────

export const mockStaff: Staff[] = [
  {
    id: 'stf-001',
    role: 'staff',
    name: 'Ngozi Eze',
    phone: '+2348100001111',
    email: 'ngozi.eze@ybride.ng',
    isActive: true,
    createdAt: now - 90 * day,
    updatedAt: now - 1 * day,
    permissions: ['assign_drivers', 'view_bookings', 'view_fleet'],
  },
  {
    id: 'stf-002',
    role: 'staff',
    name: 'Ifeanyi Ojo',
    phone: '+2348100002222',
    email: 'ifeanyi.ojo@ybride.ng',
    isActive: true,
    createdAt: now - 30 * day,
    updatedAt: now - 4 * hour,
    permissions: ['assign_drivers', 'view_bookings', 'view_fleet', 'cancel_bookings'],
  },
];

// ─── Passengers ─────────────────────────────────────────────────────────────

export const mockPassengers: Passenger[] = [
  {
    id: 'pax-001',
    role: 'passenger',
    name: 'Adaeze Okafor',
    phone: '+2348101234567',
    email: 'adaeze.okafor@gmail.com',
    isActive: true,
    createdAt: now - 180 * day,
    updatedAt: now - 4 * hour,
    totalTrips: 47,
    averageRating: 4.9,
  },
  {
    id: 'pax-002',
    role: 'passenger',
    name: 'Bashir Yusuf',
    phone: '+2348109988776',
    email: 'bashir.yusuf@gmail.com',
    isActive: true,
    createdAt: now - 60 * day,
    updatedAt: now - 1 * day,
    totalTrips: 12,
    averageRating: 4.7,
  },
  {
    id: 'pax-003',
    role: 'passenger',
    name: 'Chiamaka Nnaji',
    phone: '+2348106789012',
    email: 'chiamaka.nnaji@gmail.com',
    isActive: true,
    createdAt: now - 14 * day,
    updatedAt: now - 30 * minute,
    totalTrips: 4,
    averageRating: 5,
  },
];

// ─── Drivers ────────────────────────────────────────────────────────────────

export const mockDrivers: Driver[] = [
  {
    id: 'drv-001',
    role: 'driver',
    name: 'Emeka Obi',
    phone: '+2348012345678',
    email: 'emeka.obi@ybride.ng',
    isActive: true,
    createdAt: now - 90 * day,
    updatedAt: now - 1 * hour,
    vehicle: { make: 'Toyota', model: 'Corolla', year: 2018, plate: 'AGB-244-XB', color: 'Silver' },
    carTypeId: 'ct-standard',
    documents: { uploadedAt: now - 89 * day, verifiedAt: now - 88 * day, verifiedBy: 'test-admin-123' },
    status: 'online',
    lastKnownLocation: { latitude: 6.213, longitude: 6.197 },
    lastLocationUpdate: now - 30_000,
    totalTrips: 412,
    totalEarningsKobo: 18_450_000,
    averageRating: 4.8,
    approvedAt: now - 88 * day,
    approvedBy: 'test-admin-123',
  },
  {
    id: 'drv-002',
    role: 'driver',
    name: 'Chinonso Ade',
    phone: '+2348022334455',
    email: 'chinonso.ade@ybride.ng',
    isActive: true,
    createdAt: now - 60 * day,
    updatedAt: now - 5 * minute,
    vehicle: { make: 'Honda', model: 'Accord', year: 2020, plate: 'AGB-119-ZK', color: 'Black' },
    carTypeId: 'ct-premium',
    documents: { uploadedAt: now - 60 * day, verifiedAt: now - 59 * day, verifiedBy: 'test-admin-123' },
    status: 'on_trip',
    lastKnownLocation: { latitude: 6.221, longitude: 6.203 },
    lastLocationUpdate: now - 12_000,
    totalTrips: 287,
    totalEarningsKobo: 22_100_000,
    averageRating: 4.9,
    approvedAt: now - 59 * day,
    approvedBy: 'test-admin-123',
    currentBookingId: 'bk-204',
  },
  {
    id: 'drv-003',
    role: 'driver',
    name: 'Tunde Bello',
    phone: '+2348033445566',
    email: 'tunde.bello@ybride.ng',
    isActive: true,
    createdAt: now - 120 * day,
    updatedAt: now - 2 * hour,
    vehicle: { make: 'Hyundai', model: 'Elantra', year: 2017, plate: 'AGB-045-BC', color: 'Blue' },
    carTypeId: 'ct-standard',
    documents: { uploadedAt: now - 120 * day, verifiedAt: now - 118 * day, verifiedBy: 'test-admin-123' },
    status: 'online',
    lastKnownLocation: { latitude: 6.218, longitude: 6.205 },
    lastLocationUpdate: now - 45_000,
    totalTrips: 503,
    totalEarningsKobo: 21_800_000,
    averageRating: 4.6,
    approvedAt: now - 118 * day,
    approvedBy: 'test-admin-123',
  },
  {
    id: 'drv-004',
    role: 'driver',
    name: 'Ifeoma Eze',
    phone: '+2348099887766',
    email: 'ifeoma.eze@ybride.ng',
    isActive: true,
    createdAt: now - 4 * day,
    updatedAt: now - 15 * minute,
    vehicle: { make: 'Toyota', model: 'Highlander', year: 2019, plate: 'AGB-371-MQ', color: 'White' },
    carTypeId: 'ct-suv',
    documents: { uploadedAt: now - 4 * day, verifiedAt: now - 3 * day, verifiedBy: 'test-admin-123' },
    status: 'offline',
    lastKnownLocation: { latitude: 6.209, longitude: 6.193 },
    lastLocationUpdate: now - 30 * minute,
    totalTrips: 12,
    totalEarningsKobo: 540_000,
    averageRating: 4.7,
    approvedAt: now - 3 * day,
    approvedBy: 'test-admin-123',
  },
];

// ─── Bookings ───────────────────────────────────────────────────────────────

const carTypeMap: Record<string, { name: string; baseFare: number; pricePerKm: number }> = {
  'ct-standard': { name: 'Standard', baseFare: 50_000, pricePerKm: 10_000 },
  'ct-premium': { name: 'Premium', baseFare: 80_000, pricePerKm: 15_000 },
  'ct-suv': { name: 'SUV', baseFare: 100_000, pricePerKm: 20_000 },
};

function makeBooking(p: Partial<Booking> & Pick<Booking, 'id' | 'status' | 'createdAt'>): Booking {
  const distanceKm = p.fare?.estimatedDistanceKm ?? 6.4;
  const carTypeId = p.carTypeId ?? 'ct-standard';
  const ct = carTypeMap[carTypeId]!;
  const baseFare = ct.baseFare;
  const distanceFare = Math.round(ct.pricePerKm * distanceKm);
  const zoneSurcharge = p.fare?.zoneSurcharge ?? 0;
  return {
    id: p.id,
    passengerId: p.passengerId ?? mockPassengers[0]!.id,
    pickup: p.pickup ?? {
      label: 'Home',
      formatted: '12 Market Rd, Agbor',
      point: { latitude: 6.215, longitude: 6.198 },
    },
    dropoff: p.dropoff ?? {
      label: 'Work',
      formatted: 'Delta State University, Abraka',
      point: { latitude: 6.225, longitude: 6.211 },
    },
    isRoundTrip: p.isRoundTrip ?? false,
    carTypeId,
    fare: p.fare ?? {
      baseFare,
      distanceFare,
      zoneSurcharge,
      total: baseFare + distanceFare + zoneSurcharge,
      estimatedDistanceKm: distanceKm,
      estimatedDurationMin: Math.round(distanceKm * 2.4),
      currency: 'NGN',
      carTypeId,
      carTypeName: ct.name,
      appliedZoneIds: zoneSurcharge ? ['zn-airport'] : [],
    },
    status: p.status,
    driverId: p.driverId,
    staffAssignedBy: p.staffAssignedBy,
    createdAt: p.createdAt,
    paidAt: p.paidAt,
    assignedAt: p.assignedAt,
    driverArrivedAt: p.driverArrivedAt,
    startedAt: p.startedAt,
    completedAt: p.completedAt,
    cancelledAt: p.cancelledAt,
    cancellationReason: p.cancellationReason,
    cancelledBy: p.cancelledBy,
    paystackReference: p.paystackReference,
    paymentMethod: p.paymentMethod,
    actualDistanceKm: p.actualDistanceKm,
    actualDurationMin: p.actualDurationMin,
    ratingFromPassenger: p.ratingFromPassenger,
    ratingFromDriver: p.ratingFromDriver,
  };
}

export const mockBookings: Booking[] = [
  makeBooking({
    id: 'bk-205',
    status: 'paid',
    createdAt: now - 4 * minute,
    paidAt: now - 3 * minute,
    passengerId: 'pax-003',
    paystackReference: 'pyk_8F2H3J',
    paymentMethod: 'card',
  }),
  makeBooking({
    id: 'bk-209',
    status: 'paid',
    createdAt: now - 90_000,
    paidAt: now - 60_000,
    passengerId: 'pax-002',
    paystackReference: 'pyk_5R6T7Y',
    paymentMethod: 'bank_transfer',
    carTypeId: 'ct-premium',
  }),
  makeBooking({
    id: 'bk-206',
    status: 'assigned',
    createdAt: now - 9 * minute,
    paidAt: now - 8 * minute,
    assignedAt: now - 6 * minute,
    driverId: 'drv-001',
    staffAssignedBy: 'stf-001',
    passengerId: 'pax-001',
    paystackReference: 'pyk_9P4Q1L',
    paymentMethod: 'card',
  }),
  makeBooking({
    id: 'bk-207',
    status: 'driver_arrived',
    createdAt: now - 18 * minute,
    paidAt: now - 17 * minute,
    assignedAt: now - 15 * minute,
    driverArrivedAt: now - 2 * minute,
    driverId: 'drv-003',
    staffAssignedBy: 'stf-002',
    passengerId: 'pax-001',
    paystackReference: 'pyk_1A2B3C',
    paymentMethod: 'card',
  }),
  makeBooking({
    id: 'bk-204',
    status: 'in_progress',
    createdAt: now - 25 * minute,
    paidAt: now - 24 * minute,
    assignedAt: now - 23 * minute,
    driverArrivedAt: now - 14 * minute,
    startedAt: now - 11 * minute,
    driverId: 'drv-002',
    staffAssignedBy: 'stf-002',
    passengerId: 'pax-002',
    paystackReference: 'pyk_5C7P2Q',
    paymentMethod: 'card',
    carTypeId: 'ct-premium',
  }),
  makeBooking({
    id: 'bk-201',
    status: 'completed',
    createdAt: now - 3 * hour,
    paidAt: now - 3 * hour + 30_000,
    assignedAt: now - 3 * hour + 60_000,
    driverArrivedAt: now - 3 * hour + 7 * minute,
    startedAt: now - 3 * hour + 10 * minute,
    completedAt: now - 2 * hour - 40 * minute,
    driverId: 'drv-001',
    staffAssignedBy: 'stf-001',
    paystackReference: 'pyk_3J8K2M',
    paymentMethod: 'card',
    actualDistanceKm: 6.7,
    actualDurationMin: 18,
    ratingFromPassenger: { stars: 5, createdAt: now - 2 * hour - 30 * minute },
  }),
  makeBooking({
    id: 'bk-203',
    status: 'cancelled',
    createdAt: now - 6 * hour,
    paidAt: now - 6 * hour + 30_000,
    cancelledAt: now - 6 * hour + 4 * minute,
    cancelledBy: 'passenger',
    cancellationReason: 'Plans changed',
    passengerId: 'pax-003',
    paystackReference: 'pyk_2X1V8H',
    paymentMethod: 'card',
  }),
];

// ─── Live driver locations (mock RTDB feed) ─────────────────────────────────

export const mockDriverLocations: Record<string, DriverLocationDoc> = {
  'drv-001': {
    driverId: 'drv-001',
    latitude: 6.213,
    longitude: 6.197,
    heading: 124,
    speed: 0,
    timestamp: now - 30_000,
    status: 'online',
  },
  'drv-002': {
    driverId: 'drv-002',
    latitude: 6.221,
    longitude: 6.203,
    heading: 78,
    speed: 32,
    timestamp: now - 12_000,
    status: 'on_trip',
    currentBookingId: 'bk-204',
  },
  'drv-003': {
    driverId: 'drv-003',
    latitude: 6.218,
    longitude: 6.205,
    heading: 200,
    speed: 0,
    timestamp: now - 45_000,
    status: 'online',
  },
};
