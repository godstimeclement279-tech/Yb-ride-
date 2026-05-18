// All money values are stored as integer KOBO (1 NGN = 100 kobo)
// All timestamps are ms-since-epoch (number) unless noted

// ─── Roles & users ──────────────────────────────────────────────────────────

export type UserRole = 'passenger' | 'driver' | 'staff' | 'admin';

export interface BaseUser {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Passenger extends BaseUser {
  role: 'passenger';
  savedAddresses?: SavedAddress[];
  defaultPaymentMethod?: PaymentMethod;
  totalTrips: number;
  averageRating?: number;
}

export interface Driver extends BaseUser {
  role: 'driver';
  vehicle: Vehicle;
  carTypeId: string;
  documents: DriverDocuments;
  status: DriverStatus;
  // Snapshotted from RTDB; live tracking lives in /driver_locations/{driverId}
  lastKnownLocation?: GeoPoint;
  lastLocationUpdate?: number;
  totalTrips: number;
  totalEarningsKobo: number;
  averageRating?: number;
  approvedAt?: number;
  approvedBy?: string;
  currentBookingId?: string;
}

export type DriverStatus = 'offline' | 'online' | 'on_trip' | 'suspended';

export interface DriverDocuments {
  licenseUrl?: string;
  vehiclePapersUrl?: string;
  insuranceUrl?: string;
  uploadedAt?: number;
  verifiedAt?: number;
  verifiedBy?: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
}

export interface Staff extends BaseUser {
  role: 'staff';
  permissions: StaffPermission[];
}

export type StaffPermission =
  | 'assign_drivers'
  | 'view_bookings'
  | 'view_fleet'
  | 'cancel_bookings';

export interface Admin extends BaseUser {
  role: 'admin';
}

// ─── Geo & addresses ────────────────────────────────────────────────────────

export interface GeoPoint {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: number;
}

export interface Address {
  label: string;
  formatted: string;
  point: GeoPoint;
  placeId?: string;
}

export interface SavedAddress extends Address {
  id: string;
  type: 'home' | 'work' | 'other';
  createdAt: number;
}

// ─── Pricing ────────────────────────────────────────────────────────────────

export interface CarType {
  id: string;
  name: string;
  baseFare: number;
  pricePerKm: number;
  seats: number;
  iconUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Zone {
  id: string;
  name: string;
  // Ordered ring of GeoPoints (open or closed — both work).
  // Surcharge applies if pickup OR dropoff falls inside.
  polygon: GeoPoint[];
  surcharge: number;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  zoneSurcharge: number;
  total: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  currency: 'NGN';
  carTypeId: string;
  carTypeName: string;
  appliedZoneIds: string[];
}

// ─── Bookings & trips ───────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending_payment'
  | 'paid'
  | 'assigned'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  passengerId: string;

  pickup: Address;
  dropoff: Address;
  isRoundTrip: boolean;

  carTypeId: string;
  fare: FareBreakdown;

  status: BookingStatus;
  driverId?: string;
  staffAssignedBy?: string;

  createdAt: number;
  paidAt?: number;
  assignedAt?: number;
  // Driver acknowledged + accepted the offer. While status='assigned' and
  // acceptedAt is undefined, the booking is "offered" and the driver app
  // shows accept/decline. acceptedAt set → driver is en route.
  acceptedAt?: number;
  // Drivers that declined this booking — staff should re-assign elsewhere.
  declinedDriverIds?: string[];
  driverArrivedAt?: number;
  startedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancellationReason?: string;
  cancelledBy?: 'passenger' | 'driver' | 'staff' | 'admin';

  paystackReference?: string;
  paymentMethod?: PaymentMethod;

  actualDistanceKm?: number;
  actualDurationMin?: number;

  ratingFromPassenger?: Rating;
  ratingFromDriver?: Rating;
}

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet';

export interface Rating {
  stars: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: number;
}

// ─── Realtime DB shape (driver GPS) ─────────────────────────────────────────

export interface DriverLocationDoc {
  driverId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: number;
  status: DriverStatus;
  currentBookingId?: string;
}

// ─── Promos (admin-managed) ─────────────────────────────────────────────────

export type PromoKind = 'percentage' | 'fixed';

export interface Promo {
  id: string;
  code: string;
  kind: PromoKind;
  value: number;            // percent (1-100) or kobo
  maxDiscount?: number;     // kobo cap when kind='percentage'
  minTripAmount?: number;   // kobo
  usageLimit?: number;
  usageCount: number;
  startsAt: number;
  expiresAt: number;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
}
