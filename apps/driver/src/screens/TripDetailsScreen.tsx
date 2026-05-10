import React from 'react';
import { View } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Divider } from '../components/Divider';
import { StatusBadge } from '../components/StatusBadge';
import { StarRating } from '../components/StarRating';
import { useTheme } from '../theme/ThemeProvider';
import { useTrip } from '../context/TripContext';
import {
  formatNaira,
  formatNairaExact,
  formatDistance,
  formatDuration,
} from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripDetails'>;

function fmtTime(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TripDetailsScreen() {
  const route = useRoute<Route>();
  const { spacing, colors } = useTheme();
  const { pastBookings, activeBooking } = useTrip();

  const booking =
    pastBookings.find(b => b.id === route.params.bookingId) ??
    (activeBooking?.id === route.params.bookingId ? activeBooking : undefined);

  if (!booking) {
    return (
      <Screen>
        <Text variant="h3">Trip not found</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h2">Trip</Text>
        <StatusBadge status={booking.status} />
      </View>
      <Text variant="caption" color="muted">{booking.id}</Text>

      <Card>
        <Text variant="caption" color="muted">ROUTE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs }}>
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
            <Text variant="body">{booking.pickup.label}</Text>
            <Text variant="small" color="muted">{booking.pickup.formatted}</Text>
          </View>
        </View>
        <View style={{ marginVertical: spacing.sm }}><Divider inset={spacing.lg} /></View>
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
            <Text variant="body">{booking.dropoff.label}</Text>
            <Text variant="small" color="muted">{booking.dropoff.formatted}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="caption" color="muted">FARE</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Text variant="small">Base fare</Text>
          <Text variant="small">{formatNairaExact(booking.fare.baseFare)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
          <Text variant="small">
            Distance ({formatDistance(booking.fare.estimatedDistanceKm)})
          </Text>
          <Text variant="small">{formatNairaExact(booking.fare.distanceFare)}</Text>
        </View>
        {booking.fare.zoneSurcharge > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
            <Text variant="small">Zone surcharge</Text>
            <Text variant="small">{formatNairaExact(booking.fare.zoneSurcharge)}</Text>
          </View>
        )}
        <View style={{ marginVertical: spacing.sm }}><Divider /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">Total</Text>
          <Text variant="bodyStrong" color="primary">
            {formatNaira(booking.fare.total)}
          </Text>
        </View>
        <Text variant="caption" color="muted">
          {booking.fare.carTypeName} · {booking.isRoundTrip ? 'Round trip' : 'One-way'} · {booking.paymentMethod ?? 'card'}
        </Text>
      </Card>

      <Card>
        <Text variant="caption" color="muted">TIMELINE</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
          <Row label="Created" value={fmtTime(booking.createdAt)} />
          <Row label="Paid" value={fmtTime(booking.paidAt)} />
          <Row label="Assigned" value={fmtTime(booking.assignedAt)} />
          <Row label="Driver arrived" value={fmtTime(booking.driverArrivedAt)} />
          <Row label="Started" value={fmtTime(booking.startedAt)} />
          <Row label="Completed" value={fmtTime(booking.completedAt)} />
          {booking.cancelledAt && <Row label="Cancelled" value={fmtTime(booking.cancelledAt)} />}
        </View>
      </Card>

      {(booking.actualDistanceKm != null || booking.actualDurationMin != null) && (
        <Card>
          <Text variant="caption" color="muted">ACTUAL</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
            <Text variant="small">Distance</Text>
            <Text variant="small">{formatDistance(booking.actualDistanceKm ?? 0)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
            <Text variant="small">Duration</Text>
            <Text variant="small">{formatDuration(booking.actualDurationMin ?? 0)}</Text>
          </View>
        </Card>
      )}

      {booking.ratingFromPassenger && (
        <Card>
          <Text variant="caption" color="muted">PASSENGER RATED YOU</Text>
          <View style={{ marginTop: spacing.xs }}>
            <StarRating value={booking.ratingFromPassenger.stars} size={22} />
          </View>
          {booking.ratingFromPassenger.comment && (
            <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>
              "{booking.ratingFromPassenger.comment}"
            </Text>
          )}
        </Card>
      )}

      {booking.cancellationReason && (
        <Card>
          <Text variant="caption" color="error">CANCELLATION</Text>
          <Text variant="small" style={{ marginTop: spacing.xs }}>
            {booking.cancellationReason} · by {booking.cancelledBy}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="small" color="muted">{label}</Text>
      <Text variant="small">{value}</Text>
    </View>
  );
}
