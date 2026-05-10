// Live-data hooks. Each hook subscribes to Firebase when configured, otherwise
// returns the mock dataset so the UI is fully previewable in dev.

import { useEffect, useState } from 'react';
import type {
  Booking,
  Driver,
  DriverLocationDoc,
  Passenger,
} from '@yb/shared';
import { FIREBASE_CONFIGURED } from '../services/firebase';
import {
  subscribeAllBookings,
  subscribeBooking,
} from '../services/firebase/bookingsService';
import {
  subscribeAllDrivers,
  subscribeAssignableDrivers,
  subscribeDriver,
} from '../services/firebase/driversService';
import { subscribeFleetLocations } from '../services/firebase/driverLocationsService';
import { subscribePassenger } from '../services/firebase/passengersService';
import {
  mockBookings,
  mockDriverLocations,
  mockDrivers,
  mockPassengers,
} from '../data/mock';

// ─── Bookings ───────────────────────────────────────────────────────────────

export function useAllBookings(): Booking[] {
  const [bookings, setBookings] = useState<Booking[]>(
    FIREBASE_CONFIGURED ? [] : mockBookings,
  );
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    return subscribeAllBookings(setBookings);
  }, []);
  return bookings;
}

export function useBooking(id: string | undefined): {
  booking: Booking | null;
  loading: boolean;
} {
  const [state, setState] = useState<{ booking: Booking | null; loading: boolean }>(
    () => {
      if (!id) return { booking: null, loading: false };
      if (FIREBASE_CONFIGURED) return { booking: null, loading: true };
      return {
        booking: mockBookings.find((b) => b.id === id) ?? null,
        loading: false,
      };
    },
  );
  useEffect(() => {
    if (!id) {
      setState({ booking: null, loading: false });
      return;
    }
    if (!FIREBASE_CONFIGURED) {
      setState({
        booking: mockBookings.find((b) => b.id === id) ?? null,
        loading: false,
      });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    return subscribeBooking(id, (b) => setState({ booking: b, loading: false }));
  }, [id]);
  return state;
}

// ─── Drivers ────────────────────────────────────────────────────────────────

export function useAllDrivers(): Driver[] {
  const [drivers, setDrivers] = useState<Driver[]>(
    FIREBASE_CONFIGURED ? [] : mockDrivers,
  );
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    return subscribeAllDrivers(setDrivers);
  }, []);
  return drivers;
}

/** Online + active drivers — for the assignment picker. */
export function useAssignableDrivers(): Driver[] {
  const [drivers, setDrivers] = useState<Driver[]>(
    FIREBASE_CONFIGURED
      ? []
      : mockDrivers.filter((d) => d.isActive && d.status === 'online'),
  );
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    return subscribeAssignableDrivers(setDrivers);
  }, []);
  return drivers;
}

export function useDriver(id: string | undefined): Driver | null {
  const [driver, setDriver] = useState<Driver | null>(() => {
    if (!id) return null;
    if (FIREBASE_CONFIGURED) return null;
    return mockDrivers.find((d) => d.id === id) ?? null;
  });
  useEffect(() => {
    if (!id) {
      setDriver(null);
      return;
    }
    if (!FIREBASE_CONFIGURED) {
      setDriver(mockDrivers.find((d) => d.id === id) ?? null);
      return;
    }
    return subscribeDriver(id, setDriver);
  }, [id]);
  return driver;
}

// ─── Fleet locations (RTDB) ─────────────────────────────────────────────────

export function useFleetLocations(): Record<string, DriverLocationDoc> {
  const [locs, setLocs] = useState<Record<string, DriverLocationDoc>>(
    FIREBASE_CONFIGURED ? {} : mockDriverLocations,
  );
  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return;
    return subscribeFleetLocations(setLocs);
  }, []);
  return locs;
}

// ─── Passenger lookup ───────────────────────────────────────────────────────

export function usePassenger(id: string | undefined): Passenger | null {
  const [p, setP] = useState<Passenger | null>(() => {
    if (!id) return null;
    if (FIREBASE_CONFIGURED) return null;
    return mockPassengers.find((m) => m.id === id) ?? null;
  });
  useEffect(() => {
    if (!id) {
      setP(null);
      return;
    }
    if (!FIREBASE_CONFIGURED) {
      setP(mockPassengers.find((m) => m.id === id) ?? null);
      return;
    }
    return subscribePassenger(id, setP);
  }, [id]);
  return p;
}
