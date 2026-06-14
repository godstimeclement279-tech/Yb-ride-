import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { Header } from '../components/Header';
import { IconTile } from '../components/IconTile';
import { RouteTimeline } from '../components/RouteTimeline';
import { useTheme } from '../theme/ThemeProvider';
import { useRide } from '../context/RideContext';
import {
  formatNaira,
  formatNairaExact,
  formatDistance,
} from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CAR_ICON: Record<string, string> = {
  standard: '🚗',
  premium: '🚙',
  suv: '🚐',
};

export function FareBreakdownScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const {
    pickup,
    dropoff,
    carType,
    fare,
    appliedPromo,
    promoDiscountKobo,
    totalAfterPromoKobo,
    createBooking,
  } = useRide();
  const [busy, setBusy] = useState(false);

  if (!pickup || !dropoff || !carType || !fare) {
    return (
      <Screen scroll>
        <Header title="Fare Breakdown" back />
        <Text variant="body" color="muted">No active fare.</Text>
      </Screen>
    );
  }

  const onContinue = async () => {
    setBusy(true);
    const booking = await createBooking();
    setBusy(false);
    if (booking) {
      navigation.navigate('Payment', { bookingId: booking.id });
    }
  };

  return (
    <Screen scroll background="background">
      <Header title="Fare Breakdown" back />

      <Card variant="soft">
        <RouteTimeline
          stops={[
            { type: 'pickup', label: pickup.label, detail: pickup.formatted },
            { type: 'dropoff', label: dropoff.label, detail: dropoff.formatted },
          ]}
          compact
        />
      </Card>

      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 56,
              height: 48,
              backgroundColor: colors.text,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24, color: colors.background }}>
              {CAR_ICON[carType.id] ?? '🚕'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">YB {carType.name}</Text>
            <Text variant="small" color="muted">
              {carType.seats} seats · {formatDistance(fare.estimatedDistanceKm)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="bodyStrong">{formatNaira(fare.total)}</Text>
            <Text variant="caption" color="muted">Est. fare</Text>
          </View>
        </View>
      </Card>

      <Text variant="h2" style={{ marginTop: spacing.sm }}>
        Price Details
      </Text>

      <Card variant="soft">
        <PriceRow label="Base Fare" value={formatNairaExact(fare.baseFare)} />
        <PriceRow
          label={`Distance (${formatDistance(fare.estimatedDistanceKm)})`}
          value={formatNairaExact(fare.distanceFare)}
        />
        {fare.zoneSurcharge > 0 && (
          <PriceRow label="Zone Surcharge" value={formatNairaExact(fare.zoneSurcharge)} />
        )}
        <PriceRow label="Booking Fee" value={formatNairaExact(0)} muted />
        {appliedPromo && (
          <PriceRow
            label={`Promo (${appliedPromo.code})`}
            value={`-${formatNairaExact(promoDiscountKobo)}`}
            highlight
          />
        )}
        <View style={{ marginVertical: spacing.sm }}>
          <Divider />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">Total Estimated Fare</Text>
          <Text variant="bodyStrong">{formatNaira(totalAfterPromoKobo)}</Text>
        </View>
      </Card>

      <Text variant="h2" style={{ marginTop: spacing.sm }}>
        Payment Method
      </Text>

      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconTile size={44} variant="soft">
            <Text>🏦</Text>
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Bank Transfer</Text>
            <Text variant="caption" color="muted">Paystack virtual account</Text>
          </View>
        </View>
      </Card>

      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Text>ⓘ</Text>
          <Text variant="small" color="muted" style={{ flex: 1 }}>
            Actual fare may vary based on traffic, tolls, and other factors during the trip.
          </Text>
        </View>
      </Card>

      {!appliedPromo && (
        <Button
          label="Apply Promo Code"
          variant="ghost"
          onPress={() => navigation.navigate('PromoCodes')}
        />
      )}

      <Button
        label={`Continue · ${formatNaira(totalAfterPromoKobo)}`}
        onPress={onContinue}
        loading={busy}
        size="lg"
      />
    </Screen>
  );
}

function PriceRow({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
      }}
    >
      <Text variant="small" color={muted ? 'subtle' : 'muted'}>
        {label}
      </Text>
      <Text variant="small" color={highlight ? 'success' : muted ? 'subtle' : 'text'}>
        {value}
      </Text>
    </View>
  );
}
