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
import type { Booking, BookingStatus, DriverStatus, Rating } from '@yb/shared';
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
  completeTrip: (args?: {
    actualDistanceKm?: number;
    actualDurationMin?: number;
  }) => void;
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
        },
      );
    },
    [stopLocationWatch],
  );

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
        // Start foreground GPS pings (asks for permission first time).
        startLocationWatch(driverId);
      } else {
        stopLocationWatch();
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
      completeTrip,
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
      completeTrip,
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
