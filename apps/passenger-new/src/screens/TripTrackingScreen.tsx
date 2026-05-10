import React, { useEffect } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BottomSheet } from '../components/BottomSheet';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { Avatar } from '../components/Avatar';
import { IconButton } from '../components/IconButton';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { Divider } from '../components/Divider';
import { useRide } from '../context/RideContext';
import { MOCK_ACTIVE_DRIVER } from '../data/mockData';
import { formatNaira, formatDistance, type BookingStatus } from '@yb/shared';
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

  // Auto-advance through statuses for the demo flow.
  // Sequence starts at 'paid' so the trip moves forward right after payment.
  useEffect(() => {
    if (!booking) return;
    const seq: BookingStatus[] = [
      'paid',
      'assigned',
      'driver_arrived',
      'in_progress',
      'completed',
    ];
    const order = seq.indexOf(booking.status);
    if (order < 0 || order === seq.length - 1) return;

    const next = seq[order + 1]!;
    const delays: Partial<Record<BookingStatus, number>> = {
      paid: 2500,
      assigned: 4000,
      driver_arrived: 5000,
      in_progress: 6000,
    };
    const t = setTimeout(() => {
      const patch: Record<string, unknown> = { status: next };
      if (next === 'assigned') patch.assignedAt = Date.now();
      if (next === 'driver_arrived') patch.driverArrivedAt = Date.now();
      if (next === 'in_progress') patch.startedAt = Date.now();
      if (next === 'completed') patch.completedAt = Date.now();
      updateBooking(booking.id, patch as any);
    }, delays[booking.status] ?? 4000);
    return () => clearTimeout(t);
  }, [booking?.status, booking?.id, updateBooking]);

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

  const callDriver = () => Linking.openURL(`tel:${MOCK_ACTIVE_DRIVER.phone}`);

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Map fills upper portion */}
      <View style={{ flex: 1 }}>
        <MapPlaceholder
          style={{ flex: 1 }}
          hasRoute
          pickupLabel={booking.pickup.label}
          dropoffLabel={booking.dropoff.label}
          showAttribution={false}
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
            <IconButton glyph="‹" onPress={() => navigation.goBack()} />
            <Pill />
            <View
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
            </View>
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
          <Avatar name={MOCK_ACTIVE_DRIVER.name} size={56} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="bodyStrong">{MOCK_ACTIVE_DRIVER.name}</Text>
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
                  ★ {MOCK_ACTIVE_DRIVER.rating.toFixed(1)}
                </Text>
              </View>
            </View>
            <Text variant="small" color="muted">
              {MOCK_ACTIVE_DRIVER.vehicle.color} {MOCK_ACTIVE_DRIVER.vehicle.make}{' '}
              {MOCK_ACTIVE_DRIVER.vehicle.model} · {MOCK_ACTIVE_DRIVER.vehicle.plate}
            </Text>
          </View>
          <IconButton glyph="📞" onPress={callDriver} variant="card" />
          <IconButton glyph="⊕" onPress={() => {}} variant="card" />
        </View>

        <Divider />

        {/* Stats row */}
        <View style={{ flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.md }}>
          <Stat label="Arrival Time" value={booking.status === 'in_progress' ? '12 mins' : '4 mins'} />
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
            label="View Receipt"
            onPress={() => navigation.replace('Receipt', { bookingId: booking.id })}
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
