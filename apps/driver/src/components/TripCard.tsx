import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { Divider } from './Divider';
import { formatNaira, formatDistance, type Booking } from '@yb/shared';

interface TripCardProps {
  booking: Booking;
  onPress?: () => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TripCard({ booking, onPress }: TripCardProps) {
  const { colors, spacing } = useTheme();

  const inner = (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text variant="caption" color="muted">
          {formatDate(booking.createdAt)}
        </Text>
        <StatusBadge status={booking.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
        <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
          {booking.pickup.label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.primary }} />
        <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
          {booking.dropoff.label}
        </Text>
      </View>

      <View style={{ marginVertical: spacing.sm }}>
        <Divider />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="small" color="muted">
          {formatDistance(booking.fare.estimatedDistanceKm)} · {booking.fare.carTypeName}
        </Text>
        <Text variant="bodyStrong" color="primary">
          {formatNaira(booking.fare.total)}
        </Text>
      </View>
    </Card>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {inner}
    </Pressable>
  );
}
