import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Booking, BookingStatus, DriverStatus, Rating } from '@yb/shared';
import {
  MOCK_ASSIGNED_BOOKING,
  MOCK_PAST_BOOKINGS,
  MOCK_EARNINGS,
} from '../data/mockData';

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

  // Currently assigned/active trip (if any).
  activeBooking: Booking | null;
  // History (completed + cancelled).
  pastBookings: Booking[];

  // Lifecycle actions on the active booking.
  acceptTrip: () => void;
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
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('offline');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(MOCK_ASSIGNED_BOOKING);
  const [pastBookings, setPastBookings] = useState<Booking[]>(MOCK_PAST_BOOKINGS);

  const setOnline = useCallback((online: boolean) => {
    setDriverStatus(prev => {
      if (activeBooking && blockedWhenOnTrip.includes(activeBooking.status)) {
        // Cannot toggle off while on a trip.
        return 'on_trip';
      }
      return online ? 'online' : 'offline';
    });
  }, [activeBooking]);

  const patchActive = useCallback((patch: Partial<Booking>) => {
    setActiveBooking(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const acceptTrip = useCallback(() => {
    setDriverStatus('on_trip');
    // status stays 'assigned' until arrival; just acknowledged.
  }, []);

  const markArrived = useCallback(() => {
    patchActive({ status: 'driver_arrived', driverArrivedAt: Date.now() });
  }, [patchActive]);

  const startTrip = useCallback(() => {
    patchActive({ status: 'in_progress', startedAt: Date.now() });
  }, [patchActive]);

  const completeTrip = useCallback(
    (args?: { actualDistanceKm?: number; actualDurationMin?: number }) => {
      setActiveBooking(prev => {
        if (!prev) return prev;
        const completed: Booking = {
          ...prev,
          status: 'completed',
          completedAt: Date.now(),
          actualDistanceKm: args?.actualDistanceKm ?? prev.fare.estimatedDistanceKm,
          actualDurationMin: args?.actualDurationMin ?? prev.fare.estimatedDurationMin,
        };
        setPastBookings(p => [completed, ...p]);
        return completed;
      });
      setDriverStatus('online');
    },
    [],
  );

  const cancelTrip = useCallback((reason: string) => {
    setActiveBooking(prev => {
      if (!prev) return prev;
      const cancelled: Booking = {
        ...prev,
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy: 'driver',
        cancelledAt: Date.now(),
      };
      setPastBookings(p => [cancelled, ...p]);
      return null; // remove from active
    });
    setDriverStatus('online');
  }, []);

  const rateRider = useCallback((rating: Rating) => {
    setActiveBooking(prev => (prev ? { ...prev, ratingFromDriver: rating } : prev));
    setPastBookings(prev =>
      prev.map(b =>
        activeBooking && b.id === activeBooking.id ? { ...b, ratingFromDriver: rating } : b,
      ),
    );
  }, [activeBooking]);

  const value = useMemo<TripContextValue>(
    () => ({
      driverStatus,
      setOnline,
      activeBooking,
      pastBookings,
      acceptTrip,
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
      acceptTrip,
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
