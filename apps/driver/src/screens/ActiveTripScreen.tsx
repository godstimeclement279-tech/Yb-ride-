import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { useTrip } from '../context/TripContext';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { Divider } from '../components/Divider';
import { StatusBadge } from '../components/StatusBadge';
import { StarRating } from '../components/StarRating';
import { Map } from '../components/Map';
import { formatNaira, formatDistance, formatDuration, type Passenger } from '@yb/shared';
import { subscribePassenger } from '../services/firebase/passengersService';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CANCEL_REASONS = [
  'Passenger no-show',
  'Wrong pickup address',
  'Vehicle issue',
  'Other',
];

export function ActiveTripScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const {
    activeBooking,
    markArrived,
    startTrip,
    cancelTrip,
    rateRider,
  } = useTrip();
  const [showRating, setShowRating] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const passengerId = activeBooking?.passengerId;
  useEffect(() => {
    if (!passengerId) {
      setPassenger(null);
      return;
    }
    return subscribePassenger(passengerId, setPassenger);
  }, [passengerId]);

  const passengerName = passenger?.name ?? 'Passenger';
  const passengerPhone = passenger?.phone ?? '';
  const passengerRating = passenger?.averageRating;

  if (!activeBooking) {
    return (
      <Screen>
        <Text variant="h3">No active trip</Text>
        <Text variant="small" color="muted">
          Once dispatch assigns you a trip it will appear here.
        </Text>
        <View style={{ height: spacing.lg }} />
        <Button label="Back to home" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const status = activeBooking.status;
  const isFinal = status === 'completed' || status === 'cancelled';

  const callPassenger = () => {
    if (!passengerPhone) {
      Alert.alert('No phone number', 'Passenger has not added a phone number.');
      return;
    }
    Linking.openURL(`tel:${passengerPhone}`);
  };

  const onCancel = () => {
    Alert.alert(
      'Cancel this trip?',
      'Pick a reason — passenger and dispatch will be notified.',
      [
        { text: 'Keep trip', style: 'cancel' },
        ...CANCEL_REASONS.map(r => ({
          text: r,
          style: r === 'Other' ? 'destructive' as const : 'default' as const,
          onPress: () => {
            cancelTrip(r);
            navigation.goBack();
          },
        })),
      ],
    );
  };

  const onSubmitRating = () => {
    rateRider({ stars, createdAt: Date.now() });
    setShowRating(false);
    navigation.goBack();
  };

  // The dropoff geofence (driver TripContext) flips the trip to 'completed'
  // automatically once the driver lingers within 50m of the destination for
  // 30s. Detect that transition here to show the rating prompt.
  useEffect(() => {
    if (status === 'completed') {
      setShowRating(true);
    }
  }, [status]);

  // Pick the primary CTA based on lifecycle.
  // No manual "Complete trip" — the geofence triggers it.
  const primaryCta = (() => {
    switch (status) {
      case 'assigned':
        return { label: "I've arrived at pickup", onPress: markArrived, variant: 'primary' as const };
      case 'driver_arrived':
        return { label: 'Start trip', onPress: startTrip, variant: 'success' as const };
      default:
        return null;
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Map
        style={{ height: 220 }}
        pickup={activeBooking.pickup.point}
        dropoff={activeBooking.dropoff.point}
        showRoute
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, gap: spacing.base, paddingBottom: spacing.xxl }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="h3">Trip</Text>
          <StatusBadge status={status} />
        </View>

        {/* Passenger card */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="h3">{passengerName.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{passengerName}</Text>
              <Text variant="small" color="muted">
                {passengerRating !== undefined ? `★ ${passengerRating.toFixed(1)} · ` : ''}
                {passengerPhone || 'No phone on file'}
              </Text>
            </View>
            <Pressable
              onPress={callPassenger}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
              }}
            >
              <Text variant="small" style={{ color: colors.textInverse, fontWeight: '600' }}>
                Call
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Route + fare */}
        <Card>
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginTop: 6,
                  backgroundColor: colors.success,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="muted">PICKUP</Text>
                <Text variant="body">{activeBooking.pickup.label}</Text>
                <Text variant="small" color="muted">{activeBooking.pickup.formatted}</Text>
              </View>
            </View>
            <Divider inset={spacing.lg} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  marginTop: 6,
                  backgroundColor: colors.primary,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="muted">DROPOFF</Text>
                <Text variant="body">{activeBooking.dropoff.label}</Text>
                <Text variant="small" color="muted">{activeBooking.dropoff.formatted}</Text>
              </View>
            </View>

            <Divider />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="small" color="muted">
                {formatDistance(activeBooking.fare.estimatedDistanceKm)} · {formatDuration(activeBooking.fare.estimatedDurationMin)}
              </Text>
              <Text variant="bodyStrong">{activeBooking.fare.carTypeName}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">Total fare</Text>
              <Text variant="h3" color="primary">
                {formatNaira(activeBooking.fare.total)}
              </Text>
            </View>
            {activeBooking.isRoundTrip && (
              <Text variant="caption" color="muted">Round trip</Text>
            )}
            {activeBooking.fare.zoneSurcharge > 0 && (
              <Text variant="caption" color="muted">
                Includes {formatNaira(activeBooking.fare.zoneSurcharge)} zone surcharge
              </Text>
            )}
          </View>
        </Card>

        {/* Rating after complete */}
        {showRating && (
          <Card>
            <View style={{ gap: spacing.sm, alignItems: 'center' }}>
              <Text variant="bodyStrong">Rate {passengerName.split(' ')[0] || 'rider'}</Text>
              <StarRating value={stars} onChange={setStars} />
              <Button label="Submit rating" onPress={onSubmitRating} />
            </View>
          </Card>
        )}

        {/* In-progress: no Complete CTA — geofence ends the trip automatically. */}
        {!isFinal && !showRating && status === 'in_progress' && (
          <View
            style={{
              padding: spacing.base,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.xs,
            }}
          >
            <Text variant="bodyStrong">Trip in progress</Text>
            <Text variant="small" color="muted">
              The trip ends automatically once you arrive at the dropoff.
              Keep GPS on so we can detect your arrival.
            </Text>
          </View>
        )}

        {/* Action buttons — only for assigned + driver_arrived. */}
        {!isFinal && !showRating && primaryCta && (
          <View style={{ gap: spacing.sm }}>
            <Button {...primaryCta} size="lg" />
            <Button
              label="Cancel trip"
              onPress={onCancel}
              variant="ghost"
            />
          </View>
        )}

        {isFinal && !showRating && (
          <Button label="Back to home" onPress={() => navigation.goBack()} />
        )}
      </ScrollView>
    </View>
  );
}
