import React, { useCallback, useEffect } from 'react';
import { Alert, BackHandler, Linking, Pressable, Share, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { Map } from '../components/Map';
import { subscribeDriverLocation } from '../services/firebase/passengerLocationService';
import { subscribeDriver } from '../services/firebase/driversService';
import { Avatar } from '../components/Avatar';
import { IconButton } from '../components/IconButton';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { Divider } from '../components/Divider';
import { useRide } from '../context/RideContext';
import { formatNaira, formatDistance, type BookingStatus, type Driver } from '@yb/shared';
import { formatEtaMinutes, getDrivingDirections } from '../services/mapbox';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TripTracking'>;

const PROGRESS_STEPS = [
  { key: 'pickup', label: 'Pickup', forStatuses: ['paid', 'assigned', 'driver_arrived'] as BookingStatus[] },
  { key: 'enroute', label: 'En Route', forStatuses: ['in_progress'] as BookingStatus[] },
  { key: 'dropoff', label: 'Drop-off', forStatuses: ['completed'] as BookingStatus[] },
];

export function TripTrackingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { getBooking, updateBooking } = useRide();

  const booking = getBooking(route.params.bookingId);

  // Trip status flows entirely from Firestore now. Staff assigns the driver,
  // the driver app drives every subsequent transition (arrived / in_progress /
  // completed). The passenger app is a read-only consumer of that state.

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.base }}>
        <Text variant="body" color="muted">No active trip.</Text>
      </SafeAreaView>
    );
  }

  const progressIndex = PROGRESS_STEPS.findIndex(step =>
    step.forStatuses.includes(booking.status),
  );
  const safeIndex = progressIndex >= 0 ? progressIndex : 0;

  const [driver, setDriver] = React.useState<Driver | null>(null);
  const driverId = booking.driverId;
  React.useEffect(() => {
    if (!driverId) {
      setDriver(null);
      return;
    }
    return subscribeDriver(driverId, setDriver);
  }, [driverId]);

  const driverName = driver?.name ?? (driverId ? 'Loading driver…' : 'Finding driver…');
  const driverPhone = driver?.phone ?? '';
  const driverRating = driver?.averageRating;
  const driverVehicle = driver?.vehicle;

  const callDriver = () => {
    if (!driverPhone) {
      Alert.alert('No phone number', 'Driver has not added a phone number.');
      return;
    }
    Linking.openURL(`tel:${driverPhone}`);
  };

  const onCancel = () =>
    Alert.alert('Cancel this trip?', 'You may be charged a small cancellation fee.', [
      { text: 'Keep trip', style: 'cancel' },
      {
        text: 'Cancel trip',
        style: 'destructive',
        onPress: () => {
          updateBooking(booking.id, {
            status: 'cancelled',
            cancellationReason: 'Passenger cancelled',
            cancelledBy: 'passenger',
            cancelledAt: Date.now(),
          });
          navigation.goBack();
        },
      },
    ]);

  const isFinal = booking.status === 'completed' || booking.status === 'cancelled';

  // Live driver location subscription — wakes when staff assigns a driver
  // and the driver app pushes pings to RTDB.
  const [driverLocation, setDriverLocation] = React.useState<
    { latitude: number; longitude: number } | null
  >(null);
  React.useEffect(() => {
    if (!booking.driverId || isFinal) {
      setDriverLocation(null);
      return;
    }
    const unsub = subscribeDriverLocation(booking.driverId, setDriverLocation);
    return unsub;
  }, [booking.driverId, isFinal]);

  const confirmExit = useCallback(() => {
    if (isFinal) {
      navigation.goBack();
      return true;
    }
    Alert.alert(
      'Leave active trip?',
      'Your driver is still on the way. Leaving this screen does not cancel the trip.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', onPress: () => navigation.goBack() },
      ],
    );
    return true;
  }, [isFinal, navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', confirmExit);
    return () => sub.remove();
  }, [confirmExit]);

  // Live ETA via Mapbox Directions. Re-runs when driver location, status, or
  // the trip endpoints change. While the driver hasn't arrived yet we route
  // driver→pickup; once in_progress we route driver→dropoff. Refreshes every
  // 30s as the driver moves.
  const [etaSec, setEtaSec] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (isFinal) {
      setEtaSec(null);
      return;
    }
    const inProgress = booking.status === 'in_progress';
    // Don't compute an ETA before a real driver location exists — routing
    // pickup→pickup returns a misleading "1 min" while still "Finding driver".
    if (!driverLocation && !inProgress) {
      setEtaSec(null);
      return;
    }
    const from = driverLocation ?? booking.pickup.point;
    const to = inProgress ? booking.dropoff.point : booking.pickup.point;
    let cancelled = false;
    const fetchEta = () => {
      getDrivingDirections(from, to).then((r) => {
        if (cancelled || !r) return;
        setEtaSec(r.durationSec);
      });
    };
    fetchEta();
    const t = setInterval(fetchEta, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [
    isFinal,
    booking.status,
    driverLocation?.latitude,
    driverLocation?.longitude,
    booking.pickup.point.latitude,
    booking.pickup.point.longitude,
    booking.dropoff.point.latitude,
    booking.dropoff.point.longitude,
  ]);

  const etaLabel = !booking.driverId
    ? 'Finding driver'
    : etaSec != null
      ? formatEtaMinutes(etaSec)
      : booking.status === 'in_progress'
        ? '—'
        : 'Locating';

  const shareTrip = async () => {
    try {
      await Share.share({
        message: `Tracking my YB Ride from ${booking.pickup.label} to ${booking.dropoff.label}. ETA ${etaLabel}.`,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Map fills upper portion */}
      <View style={{ flex: 1 }}>
        <Map
          style={{ flex: 1 }}
          pickup={booking.pickup.point}
          dropoff={booking.dropoff.point}
          driverLocation={driverLocation}
          showRoute
          bottomPadding={360}
        />

        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.base,
              paddingTop: spacing.sm,
            }}
          >
            <IconButton glyph="‹" onPress={confirmExit} />
            <Pill />
            <Pressable
              onPress={() =>
                Alert.alert('Help', 'Contact support at +234 800 000 0000 or via Help Center.')
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                backgroundColor: colors.card,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
              }}
            >
              <Text>📞</Text>
              <Text variant="smallStrong">Help</Text>
            </Pressable>
          </View>

          {/* Segmented progress floating over the map */}
          <View style={{ alignItems: 'center', marginTop: spacing.md }}>
            <SegmentedProgress steps={PROGRESS_STEPS} currentIndex={safeIndex} />
          </View>
        </SafeAreaView>
      </View>

      <BottomSheet
        background="surface"
        style={{ paddingBottom: insets.bottom + spacing.lg }}
      >
        {/* Driver row + actions */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Avatar name={driverName} size={56} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="bodyStrong">{driverName}</Text>
              {driverRating !== undefined && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: colors.successSoft,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: radius.pill,
                  }}
                >
                  <Text variant="caption" color="success" style={{ fontWeight: '700' }}>
                    ★ {driverRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="small" color="muted">
              {driverVehicle
                ? `${driverVehicle.color} ${driverVehicle.make} ${driverVehicle.model} · ${driverVehicle.plate}`
                : 'Driver vehicle pending'}
            </Text>
          </View>
          <IconButton glyph="📞" onPress={callDriver} variant="card" />
          <IconButton glyph="⊕" onPress={shareTrip} variant="card" />
        </View>

        <Divider />

        {/* Stats row */}
        <View style={{ flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.md }}>
          <Stat label="Arrival Time" value={etaLabel} />
          <Stat
            label="Distance"
            value={formatDistance(booking.fare.estimatedDistanceKm)}
          />
          <Stat label="Fare" value={formatNaira(booking.fare.total)} />
        </View>

        {/* Animated pulse */}
        <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.accent,
              }}
            />
          </View>
        </View>

        {!isFinal ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Safety Toolkit"
                variant="secondary"
                leading={<Text>🛡</Text>}
                onPress={() =>
                  Alert.alert('Safety Toolkit', 'Share trip, emergency call, and trusted contacts coming soon.')
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Cancel Trip"
                variant="ghost"
                onPress={onCancel}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Rate Your Trip"
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Rating', params: { bookingId: booking.id } }],
              })
            }
            size="lg"
          />
        )}
      </BottomSheet>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Text variant="caption" color="muted">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

// Spacer / placeholder so the top bar's middle slot is balanced.
function Pill() {
  return <View style={{ width: 80 }} />;
}
