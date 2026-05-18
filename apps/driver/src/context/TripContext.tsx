import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import * as Location from 'expo-location';
import {
  haversineKm,
  type Booking,
  type BookingStatus,
  type DriverStatus,
  type Rating,
} from '@yb/shared';
import {
  MOCK_ASSIGNED_BOOKING,
  MOCK_PAST_BOOKINGS,
  MOCK_EARNINGS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { FIREBASE_CONFIGURED } from '../services/firebase/index';
import {
  acceptBooking,
  declineBooking,
  subscribeActiveBooking,
  subscribeDriverHistory,
  updateBookingStatus,
} from '../services/firebase/bookingsService';
import { setDriverStatus } from '../services/firebase/driversService';
import {
  clearDriverLocation,
  pushDriverLocation,
} from '../services/firebase/driverLocationsService';
import {
  startBackgroundLocation,
  stopBackgroundLocation,
} from '../services/locationTask';

// ─── Trip lifecycle on the driver side ─────────────────────────────────────
// Staff assigns a paid booking → status: 'assigned'.
// Driver actions:
//   accept       → keeps 'assigned' (acknowledged, en route to pickup)
//   arrived      → 'driver_arrived'
//   start        → 'in_progress'
//   complete     → 'completed' (actualDistance / duration captured)
//   cancel       → 'cancelled' (with reason)

interface TripContextValue {
  driverStatus: DriverStatus;
  setOnline: (online: boolean) => void;

  activeBooking: Booking | null;
  pastBookings: Booking[];

  // True when staff has offered a booking but driver hasn't yet accepted.
  hasIncomingOffer: boolean;

  acceptTrip: () => Promise<void>;
  declineTrip: () => Promise<void>;
  markArrived: () => void;
  startTrip: () => void;
  // Trip completion is driven by the dropoff geofence — no manual UI action.
  // Exposed for testing / fallback only; production UI should not bind to it.
  cancelTrip: (reason: string) => void;
  rateRider: (rating: Rating) => void;

  earnings: typeof MOCK_EARNINGS;
}

const TripContext = createContext<TripContextValue | null>(null);

const blockedWhenOnTrip: BookingStatus[] = [
  'assigned',
  'driver_arrived',
  'in_progress',
];

export function TripProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const driverId = user?.id;

  const [driverStatus, setDriverStatusLocal] = useState<DriverStatus>('offline');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(
    FIREBASE_CONFIGURED ? null : MOCK_ASSIGNED_BOOKING,
  );
  const [pastBookings, setPastBookings] = useState<Booking[]>(
    FIREBASE_CONFIGURED ? [] : MOCK_PAST_BOOKINGS,
  );

  // Foreground GPS watch handle. Cleared on offline / logout.
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // ─── Geofence auto-complete refs ──────────────────────────────────────────
  // Driver no longer manually completes a trip. Once the trip is in_progress,
  // each GPS ping checks distance to the dropoff. After GEOFENCE_DWELL_MS of
  // continuous time within GEOFENCE_RADIUS_M of dropoff, completeTrip fires.

  // Current activeBooking, kept fresh for the GPS handler closure.
  const activeBookingRef = useRef<Booking | null>(activeBooking);
  // Timestamp (ms) of first ping inside the geofence; null when outside.
  const geofenceEnteredAtRef = useRef<number | null>(null);
  // Booking ID we've already triggered auto-complete for (idempotent guard).
  const autoCompletedBookingIdRef = useRef<string | null>(null);
  // Lazily set to the completeTrip callback (defined later in this file).
  const completeTripRef = useRef<() => void>(() => {});

  // Sync activeBookingRef every render so the GPS handler sees the latest.
  // Reset dwell + auto-complete guard when a new booking arrives.
  useEffect(() => {
    const prevId = activeBookingRef.current?.id;
    activeBookingRef.current = activeBooking;
    if (activeBooking?.id !== prevId) {
      geofenceEnteredAtRef.current = null;
      autoCompletedBookingIdRef.current = null;
    }
  }, [activeBooking]);

  const stopLocationWatch = useCallback(() => {
    locationWatchRef.current?.remove();
    locationWatchRef.current = null;
  }, []);

  // Subscribe assigned trip + history.
  useEffect(() => {
    if (!driverId) return;
    const unsubActive = subscribeActiveBooking(driverId, setActiveBooking);
    const unsubHistory = subscribeDriverHistory(driverId, setPastBookings);
    return () => {
      unsubActive();
      unsubHistory();
    };
  }, [driverId]);

  // Cleanup GPS watch on unmount or driver change.
  useEffect(() => {
    return () => stopLocationWatch();
  }, [driverId, stopLocationWatch]);

  // Start foreground GPS pings every 5s. Pushes to RTDB.
  const startLocationWatch = useCallback(
    async (driverIdLocal: string) => {
      stopLocationWatch();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.warn('Location permission denied');
        return;
      }
      try {
        // Immediate ping so the marker appears instantly.
        const first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await pushDriverLocation(driverIdLocal, {
          latitude: first.coords.latitude,
          longitude: first.coords.longitude,
          heading: first.coords.heading,
          speed: first.coords.speed,
          accuracy: first.coords.accuracy,
        });
      } catch (err) {
        if (__DEV__) console.warn('getCurrentPositionAsync error', err);
      }
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        loc => {
          pushDriverLocation(driverIdLocal, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading: loc.coords.heading,
            speed: loc.coords.speed,
            accuracy: loc.coords.accuracy,
          }).catch(err => {
            if (__DEV__) console.warn('pushDriverLocation error', err);
          });

          // Geofence auto-complete during in-progress trips.
          maybeAutoComplete({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        },
      );
    },
    [stopLocationWatch],
  );

  // Distance threshold (50m) and dwell duration (30s) for auto-complete.
  const GEOFENCE_RADIUS_M = 50;
  const GEOFENCE_DWELL_MS = 30_000;

  // Run on each GPS ping. Only acts while trip is in_progress.
  function maybeAutoComplete(coords: { latitude: number; longitude: number }) {
    const b = activeBookingRef.current;
    if (!b || b.status !== 'in_progress') {
      geofenceEnteredAtRef.current = null;
      return;
    }
    if (autoCompletedBookingIdRef.current === b.id) return;

    const distKm = haversineKm(coords, b.dropoff.point);
    const distM = distKm * 1000;
    if (distM > GEOFENCE_RADIUS_M) {
      geofenceEnteredAtRef.current = null;
      return;
    }
    const now = Date.now();
    if (geofenceEnteredAtRef.current == null) {
      geofenceEnteredAtRef.current = now;
      return;
    }
    if (now - geofenceEnteredAtRef.current >= GEOFENCE_DWELL_MS) {
      autoCompletedBookingIdRef.current = b.id;
      completeTripRef.current();
    }
  }

  // Drive Firestore status on toggle. Foreground GPS push starts when the
  // driver goes online.
  const setOnline = useCallback(
    (online: boolean) => {
      setDriverStatusLocal(() => {
        if (activeBooking && blockedWhenOnTrip.includes(activeBooking.status)) {
          return 'on_trip';
        }
        return online ? 'online' : 'offline';
      });
      if (!driverId) return;
      const nextStatus: DriverStatus =
        activeBooking && blockedWhenOnTrip.includes(activeBooking.status)
          ? 'on_trip'
          : online
            ? 'online'
            : 'offline';
      setDriverStatus(driverId, nextStatus).catch(err => {
        if (__DEV__) console.warn('setDriverStatus error', err);
      });
      if (online) {
        // Start foreground watch (immediate UI + geofence) and the native
        // background-location task (keeps streaming when the app is
        // backgrounded). Both push to RTDB; the bg pings stop the GPS dot
        // from going stale once the driver locks the phone.
        startLocationWatch(driverId);
        startBackgroundLocation(driverId).catch(err => {
          if (__DEV__) console.warn('startBackgroundLocation error', err);
        });
      } else {
        stopLocationWatch();
        stopBackgroundLocation().catch(err => {
          if (__DEV__) console.warn('stopBackgroundLocation error', err);
        });
        clearDriverLocation(driverId).catch(err => {
          if (__DEV__) console.warn('clearDriverLocation error', err);
        });
      }
    },
    [activeBooking, driverId, startLocationWatch, stopLocationWatch],
  );

  const patchActive = useCallback(
    (patch: Partial<Booking>) => {
      setActiveBooking(prev => (prev ? { ...prev, ...patch } : prev));
      if (activeBooking) {
        updateBookingStatus(activeBooking.id, patch).catch(err => {
          if (__DEV__) console.warn('updateBookingStatus error', err);
        });
      }
    },
    [activeBooking],
  );

  // Accept the staff offer. Sets acceptedAt on the booking so the UI moves
  // from the "Incoming trip" prompt to the active-trip flow.
  const acceptTrip = useCallback(async () => {
    if (!activeBooking) return;
    setDriverStatusLocal('on_trip');
    if (driverId) {
      setDriverStatus(driverId, 'on_trip').catch(() => {});
    }
    try {
      await acceptBooking(activeBooking.id);
    } catch (err) {
      if (__DEV__) console.warn('acceptBooking error', err);
    }
  }, [activeBooking, driverId]);

  // Decline the offer — returns booking to staff queue. Locally clear the
  // active booking instantly; the Firestore listener will confirm.
  const declineTrip = useCallback(async () => {
    if (!activeBooking || !driverId) return;
    try {
      await declineBooking(activeBooking.id, driverId);
    } catch (err) {
      if (__DEV__) console.warn('declineBooking error', err);
    }
    setActiveBooking(null);
    setDriverStatusLocal('online');
    setDriverStatus(driverId, 'online').catch(() => {});
  }, [activeBooking, driverId]);

  const markArrived = useCallback(() => {
    patchActive({ status: 'driver_arrived', driverArrivedAt: Date.now() });
  }, [patchActive]);

  const startTrip = useCallback(() => {
    patchActive({ status: 'in_progress', startedAt: Date.now() });
  }, [patchActive]);

  const completeTrip = useCallback(
    (args?: { actualDistanceKm?: number; actualDurationMin?: number }) => {
      if (!activeBooking) return;
      const patch: Partial<Booking> = {
        status: 'completed',
        completedAt: Date.now(),
        actualDistanceKm: args?.actualDistanceKm ?? activeBooking.fare.estimatedDistanceKm,
        actualDurationMin: args?.actualDurationMin ?? activeBooking.fare.estimatedDurationMin,
      };
      updateBookingStatus(activeBooking.id, patch).catch(err => {
        if (__DEV__) console.warn('completeTrip Firestore error', err);
      });
      setActiveBooking(prev => (prev ? { ...prev, ...patch } : prev));
      setDriverStatusLocal('online');
      if (driverId) setDriverStatus(driverId, 'online').catch(() => {});
    },
    [activeBooking, driverId],
  );

  // Keep the GPS-handler-facing ref in sync with the latest completeTrip.
  // Calls from inside watchPositionAsync go through this ref to avoid stale
  // closures over old activeBooking values.
  useEffect(() => {
    completeTripRef.current = () => completeTrip();
  }, [completeTrip]);

  const cancelTrip = useCallback(
    (reason: string) => {
      if (!activeBooking) return;
      const patch: Partial<Booking> = {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'driver',
        cancelledAt: Date.now(),
      };
      updateBookingStatus(activeBooking.id, patch).catch(err => {
        if (__DEV__) console.warn('cancelTrip Firestore error', err);
      });
      setActiveBooking(null);
      setDriverStatusLocal('online');
      if (driverId) setDriverStatus(driverId, 'online').catch(() => {});
    },
    [activeBooking, driverId],
  );

  const rateRider = useCallback(
    (rating: Rating) => {
      if (!activeBooking) return;
      updateBookingStatus(activeBooking.id, { ratingFromDriver: rating }).catch(
        err => {
          if (__DEV__) console.warn('rateRider Firestore error', err);
        },
      );
      setActiveBooking(prev =>
        prev ? { ...prev, ratingFromDriver: rating } : prev,
      );
    },
    [activeBooking],
  );

  const hasIncomingOffer =
    !!activeBooking &&
    activeBooking.status === 'assigned' &&
    !activeBooking.acceptedAt;

  const value = useMemo<TripContextValue>(
    () => ({
      driverStatus,
      setOnline,
      activeBooking,
      pastBookings,
      hasIncomingOffer,
      acceptTrip,
      declineTrip,
      markArrived,
      startTrip,
      cancelTrip,
      rateRider,
      earnings: MOCK_EARNINGS,
    }),
    [
      driverStatus,
      setOnline,
      activeBooking,
      pastBookings,
      hasIncomingOffer,
      acceptTrip,
      declineTrip,
      markArrived,
      startTrip,
      cancelTrip,
      rateRider,
    ],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
}
