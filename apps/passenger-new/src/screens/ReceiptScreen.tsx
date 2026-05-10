import React from 'react';
import { Alert, Share, View } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { Avatar } from '../components/Avatar';
import { MapPlaceholder } from '../components/MapPlaceholder';
import { RouteTimeline } from '../components/RouteTimeline';
import { useTheme } from '../theme/ThemeProvider';
import { useRide } from '../context/RideContext';
import { MOCK_ACTIVE_DRIVER, MOCK_PAST_BOOKINGS } from '../data/mockData';
import {
  formatNaira,
  formatNairaExact,
  formatDistance,
} from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'Receipt'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function fmtTime(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReceiptScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const { getBooking } = useRide();

  const booking =
    getBooking(route.params.bookingId) ??
    MOCK_PAST_BOOKINGS.find(b => b.id === route.params.bookingId);

  if (!booking) {
    return (
      <Screen scroll>
        <Header title="Trip Receipt" back />
        <Text variant="body" color="muted">Booking not found.</Text>
      </Screen>
    );
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: `YB Ride receipt — ${booking.pickup.label} → ${booking.dropoff.label}, ${formatNaira(booking.fare.total)}`,
      });
    } catch {
      Alert.alert('Could not share');
    }
  };

  return (
    <Screen scroll>
      <Header
        title="Trip Receipt"
        back
        trailing={
          <Text variant="h3" onPress={onShare}>↗</Text>
        }
      />

      <View
        style={{
          height: 180,
          borderRadius: radius.lg,
          overflow: 'hidden',
          marginBottom: spacing.sm,
        }}
      >
        <MapPlaceholder style={{ flex: 1 }} hasRoute />
        <View
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            backgroundColor: colors.text,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radius.pill,
          }}
        >
          <Text variant="caption" style={{ color: colors.background, fontWeight: '600' }}>
            YB {booking.fare.carTypeName}
          </Text>
        </View>
      </View>

      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={MOCK_ACTIVE_DRIVER.name} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{MOCK_ACTIVE_DRIVER.name}</Text>
            <Text variant="small" color="muted">
              ★ {MOCK_ACTIVE_DRIVER.rating.toFixed(1)} · {MOCK_ACTIVE_DRIVER.vehicle.make}{' '}
              {MOCK_ACTIVE_DRIVER.vehicle.model} ({MOCK_ACTIVE_DRIVER.vehicle.plate})
            </Text>
          </View>
          <View
            style={{
              width: 36,
              height: 36,
              backgroundColor: colors.text,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.background }}>🛡</Text>
          </View>
        </View>

        <View style={{ marginVertical: spacing.md }}>
          <Divider />
        </View>

        <RouteTimeline
          stops={[
            {
              type: 'pickup',
              label: booking.pickup.label,
              detail: booking.pickup.formatted,
              timestamp: fmtTime(booking.startedAt ?? booking.assignedAt ?? booking.createdAt),
            },
            {
              type: 'dropoff',
              label: booking.dropoff.label,
              detail: booking.dropoff.formatted,
              timestamp: fmtTime(booking.completedAt),
            },
          ]}
          compact
        />
      </Card>

      <Card variant="soft">
        <Text variant="h4">Fare Breakdown</Text>
        <View style={{ marginVertical: spacing.sm }}><Divider /></View>
        <Row label="Base Fare" value={formatNairaExact(booking.fare.baseFare)} />
        <Row
          label={`Distance (${formatDistance(booking.fare.estimatedDistanceKm)})`}
          value={formatNairaExact(booking.fare.distanceFare)}
        />
        {booking.actualDurationMin != null && (
          <Row
            label={`Time (${booking.actualDurationMin} min)`}
            value="—"
          />
        )}
        {booking.fare.zoneSurcharge > 0 && (
          <Row
            label="Zone Surcharge"
            value={formatNairaExact(booking.fare.zoneSurcharge)}
          />
        )}
        <View style={{ marginVertical: spacing.sm }}><Divider /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">Total Paid</Text>
          <Text variant="bodyStrong">{formatNaira(booking.fare.total)}</Text>
        </View>

        <View
          style={{
            marginTop: spacing.md,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.sm,
            backgroundColor: colors.background,
            borderRadius: radius.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <Text>🏦</Text>
          <Text variant="small" color="muted">
            Paid via Paystack · Bank Transfer
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
      }}
    >
      <Text variant="small" color="muted">{label}</Text>
      <Text variant="small">{value}</Text>
    </View>
  );
}
