import React, { useState } from 'react';
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
import { MapPlaceholder } from '../components/MapPlaceholder';
import { formatNaira, formatDistance, formatDuration } from '@yb/shared';
import { MOCK_ACTIVE_PASSENGER } from '../data/mockData';
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
    completeTrip,
    cancelTrip,
    rateRider,
  } = useTrip();
  const [showRating, setShowRating] = useState(false);
  const [stars, setStars] = useState<1 | 2 | 3 | 4 | 5>(5);

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
    Linking.openURL(`tel:${MOCK_ACTIVE_PASSENGER.phone}`);
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

  const onComplete = () => {
    completeTrip();
    setShowRating(true);
  };

  const onSubmitRating = () => {
    rateRider({ stars, createdAt: Date.now() });
    setShowRating(false);
    navigation.goBack();
  };

  // Pick the primary CTA based on lifecycle.
  const primaryCta = (() => {
    switch (status) {
      case 'assigned':
        return { label: "I've arrived at pickup", onPress: markArrived, variant: 'primary' as const };
      case 'driver_arrived':
        return { label: 'Start trip', onPress: startTrip, variant: 'success' as const };
      case 'in_progress':
        return { label: 'Complete trip', onPress: onComplete, variant: 'success' as const };
      default:
        return null;
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapPlaceholder
        style={{ height: 220 }}
        hasRoute
        pickupLabel={activeBooking.pickup.label}
        dropoffLabel={activeBooking.dropoff.label}
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
              <Text variant="h3">{MOCK_ACTIVE_PASSENGER.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{MOCK_ACTIVE_PASSENGER.name}</Text>
              <Text variant="small" color="muted">
                ★ {MOCK_ACTIVE_PASSENGER.rating.toFixed(1)} · {MOCK_ACTIVE_PASSENGER.phone}
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
              <Text variant="bodyStrong">Rate {MOCK_ACTIVE_PASSENGER.name.split(' ')[0]}</Text>
              <StarRating value={stars} onChange={setStars} />
              <Button label="Submit rating" onPress={onSubmitRating} />
            </View>
          </Card>
        )}

        {/* Action buttons */}
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
