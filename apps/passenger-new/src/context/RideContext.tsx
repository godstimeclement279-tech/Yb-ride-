import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  calculateFare,
  type Address,
  type Booking,
  type CarType,
  type FareBreakdown,
  type PaymentMethod,
  type Promo,
  type Zone,
} from '@yb/shared';
import {
  MOCK_CAR_TYPES,
  MOCK_CURRENT_LOCATION,
  MOCK_PROMOS,
  MOCK_ZONES,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { subscribeCarTypes } from '../services/firebase/carTypesService';
import { subscribeZones } from '../services/firebase/zonesService';
import { subscribePromos } from '../services/firebase/promosService';
import {
  createBooking as fbCreateBooking,
  updateBooking as fbUpdateBooking,
} from '../services/firebase/bookingsService';
import { getCurrentDeviceLocation } from '../services/deviceLocation';
import { reverseGeocode } from '../services/google';

interface RideContextValue {
  // Selection
  pickup: Address | null;
  dropoff: Address | null;
  carType: CarType | null;
  isRoundTrip: boolean;
  paymentMethod: PaymentMethod;
  // Catalog
  carTypes: CarType[];
  zones: Zone[];
  promos: Promo[];
  appliedPromo: Promo | null;
  // Derived
  fare: FareBreakdown | null;
  fareByCarType: Record<string, FareBreakdown>;
  promoDiscountKobo: number;
  totalAfterPromoKobo: number;
  // Actions
  setPickup: (a: Address | null) => void;
  setDropoff: (a: Address | null) => void;
  setCarType: (c: CarType) => void;
  setIsRoundTrip: (b: boolean) => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  applyPromoCode: (code: string) => { ok: boolean; reason?: string };
  clearPromo: () => void;
  resetRide: () => void;
  // Bookings
  createBooking: () => Promise<Booking | null>;
  getBooking: (id: string) => Booking | undefined;
  updateBooking: (id: string, patch: Partial<Booking>) => Promise<void>;
}

const RideContext = createContext<RideContextValue | null>(null);

function applyPromoToFare(
  fare: FareBreakdown | null,
  promo: Promo | null,
): { discountKobo: number; total: number } {
  if (!fare) return { discountKobo: 0, total: 0 };
  if (!promo) return { discountKobo: 0, total: fare.total };

  const min = promo.minTripAmount ?? 0;
  if (fare.total < min) return { discountKobo: 0, total: fare.total };

  let discount = 0;
  if (promo.kind === 'percentage') {
    discount = Math.round((fare.total * promo.value) / 100);
    if (promo.maxDiscount != null) discount = Math.min(discount, promo.maxDiscount);
  } else {
    discount = promo.value;
  }
  discount = Math.min(discount, fare.total);
  return { discountKobo: discount, total: fare.total - discount };
}

export function RideProvider({ children }: PropsWithChildren) {
  // Use useAuth (returns nullable user) instead of usePassenger (throws on
  // null). On sign-out, React commits the user=null state before the
  // RootNavigator conditional re-renders to swap RideProvider out, leaving
  // a transient render where this provider is still mounted with user=null.
  // Throwing here turned that transient state into a Render crash.
  const { user } = useAuth();
  const [pickup, setPickup] = useState<Address | null>(MOCK_CURRENT_LOCATION);
  const [dropoff, setDropoff] = useState<Address | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  // YB Ride MVP: bank transfer via Paystack is the only payment method.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);

  const [carTypes, setCarTypes] = useState<CarType[]>(MOCK_CAR_TYPES);
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [carType, setCarType] = useState<CarType | null>(MOCK_CAR_TYPES[0] ?? null);
  const [promos, setPromos] = useState<Promo[]>(MOCK_PROMOS);

  // Replace the mock pickup with the device's real GPS on first signed-in
  // mount. Permission denial or a missing native module leaves the mock in
  // place — no crash, no blocking spinner. Only runs while pickup is the
  // seeded mock so manually-set pickups aren't overwritten.
  //
  // Two-stage so a slow reverse-geocode doesn't block the pin from moving:
  //   1) getCurrentDeviceLocation → setPickup({label:'Current location', point})
  //      so the green pin + MapPicker centre snap to the real spot instantly.
  //   2) reverseGeocode runs in background. When/if it returns, swap in the
  //      real street label without touching coords. If the geocode hangs on
  //      a flaky link, the user still has working coords + a generic label.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const coords = await getCurrentDeviceLocation();
      if (cancelled || !coords) return;
      setPickup((prev) =>
        prev && prev !== MOCK_CURRENT_LOCATION
          ? prev
          : {
              label: 'Current location',
              formatted: '',
              point: { latitude: coords.latitude, longitude: coords.longitude },
            },
      );
      reverseGeocode(coords.longitude, coords.latitude).then((r) => {
        if (cancelled) return;
        setPickup((prev) => {
          if (!prev) return prev;
          // Only patch the label if the user hasn't moved the pickup elsewhere.
          if (
            prev.point.latitude !== coords.latitude ||
            prev.point.longitude !== coords.longitude
          ) {
            return prev;
          }
          return { ...prev, label: r.label, formatted: r.formatted };
        });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const unsubA = subscribeCarTypes(types => {
      setCarTypes(types);
      setCarType(prev =>
        prev ? types.find(t => t.id === prev.id) ?? types[0] ?? null : types[0] ?? null,
      );
    });
    const unsubB = subscribeZones(setZones);
    const unsubC = subscribePromos(setPromos);
    return () => {
      unsubA();
      unsubB();
      unsubC();
    };
  }, []);

  const fareByCarType = useMemo<Record<string, FareBreakdown>>(() => {
    if (!pickup || !dropoff) return {};
    const result: Record<string, FareBreakdown> = {};
    for (const ct of carTypes) {
      result[ct.id] = calculateFare({
        pickup: pickup.point,
        dropoff: dropoff.point,
        carType: ct,
        zones,
        isRoundTrip,
      });
    }
    return result;
  }, [pickup, dropoff, carTypes, zones, isRoundTrip]);

  const fare = useMemo<FareBreakdown | null>(() => {
    if (!carType) return null;
    return fareByCarType[carType.id] ?? null;
  }, [fareByCarType, carType]);

  const { discountKobo: promoDiscountKobo, total: totalAfterPromoKobo } = useMemo(
    () => applyPromoToFare(fare, appliedPromo),
    [fare, appliedPromo],
  );

  const applyPromoCode = useCallback(
    (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return { ok: false, reason: 'Enter a code' };
      const match = promos.find(p => p.code.toUpperCase() === trimmed);
      if (!match) return { ok: false, reason: 'Code not recognized' };
      if (!match.isActive) return { ok: false, reason: 'Code is inactive' };
      const now = Date.now();
      if (now < match.startsAt || now > match.expiresAt) {
        return { ok: false, reason: 'Code is expired' };
      }
      setAppliedPromo(match);
      return { ok: true };
    },
    [promos],
  );

  const clearPromo = useCallback(() => setAppliedPromo(null), []);

  const resetRide = useCallback(() => {
    setDropoff(null);
    setIsRoundTrip(false);
    setCarType(carTypes[0] ?? null);
    setAppliedPromo(null);
  }, [carTypes]);

  const createBooking = useCallback(async (): Promise<Booking | null> => {
    if (!user || !pickup || !dropoff || !carType || !fare) return null;
    const data: Omit<Booking, 'id'> = {
      passengerId: user.id,
      pickup,
      dropoff,
      isRoundTrip,
      carTypeId: carType.id,
      fare,
      status: 'pending_payment',
      createdAt: Date.now(),
      paymentMethod,
    };
    const { id } = await fbCreateBooking(data);
    const booking: Booking = { id, ...data };
    setBookings(prev => ({ ...prev, [id]: booking }));
    return booking;
  }, [pickup, dropoff, carType, fare, isRoundTrip, user?.id, paymentMethod]);

  const getBooking = useCallback((id: string) => bookings[id], [bookings]);

  const updateBooking = useCallback(
    async (id: string, patch: Partial<Booking>) => {
      setBookings(prev => {
        const existing = prev[id];
        if (!existing) return prev;
        return { ...prev, [id]: { ...existing, ...patch } };
      });
      try {
        await fbUpdateBooking(id, patch);
      } catch (err) {
        if (__DEV__) console.warn('updateBooking firestore error', err);
      }
    },
    [],
  );

  const value = useMemo<RideContextValue>(
    () => ({
      pickup,
      dropoff,
      carType,
      isRoundTrip,
      paymentMethod,
      carTypes,
      zones,
      promos,
      appliedPromo,
      fare,
      fareByCarType,
      promoDiscountKobo,
      totalAfterPromoKobo,
      setPickup,
      setDropoff,
      setCarType,
      setIsRoundTrip,
      setPaymentMethod,
      applyPromoCode,
      clearPromo,
      resetRide,
      createBooking,
      getBooking,
      updateBooking,
    }),
    [
      pickup,
      dropoff,
      carType,
      isRoundTrip,
      paymentMethod,
      carTypes,
      zones,
      promos,
      appliedPromo,
      fare,
      fareByCarType,
      promoDiscountKobo,
      totalAfterPromoKobo,
      applyPromoCode,
      clearPromo,
      resetRide,
      createBooking,
      getBooking,
      updateBooking,
    ],
  );

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRide(): RideContextValue {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used inside RideProvider');
  return ctx;
}
