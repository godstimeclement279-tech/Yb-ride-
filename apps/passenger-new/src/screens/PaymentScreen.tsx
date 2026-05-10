import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { StepIndicator } from '../components/StepIndicator';
import { useRide } from '../context/RideContext';
import { formatNaira, formatNairaExact, formatDistance } from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Payment'>;

// Single payment method: Paystack bank transfer.
// Demo flow: tap "I've Paid" → mark paid → push to TripTracking.
// Real impl will replace this with a Paystack SDK callback that fires when
// funds settle on the virtual account.

export function PaymentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors, spacing, radius } = useTheme();
  const { getBooking, updateBooking, totalAfterPromoKobo, setPaymentMethod } = useRide();

  const booking = getBooking(route.params.bookingId);
  const [paying, setPaying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60); // 15-min hold

  useEffect(() => {
    setPaymentMethod('bank_transfer');
  }, [setPaymentMethod]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.base }}>
          <Header title="Secure Payment" back />
          <Text variant="body" color="muted">Booking not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = totalAfterPromoKobo || booking.fare.total;

  const onConfirmPaid = async () => {
    setPaying(true);
    await new Promise<void>(r => setTimeout(() => r(), 900));
    await updateBooking(booking.id, {
      status: 'paid',
      paidAt: Date.now(),
      paystackReference: `pst_${Date.now()}`,
      paymentMethod: 'bank_transfer',
    });
    setPaying(false);
    navigation.replace('TripTracking', { bookingId: booking.id });
  };

  const min = Math.floor(secondsLeft / 60);
  const sec = String(secondsLeft % 60).padStart(2, '0');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.base }}>
          <Header
            title="Secure Payment"
            subtitle={`Ride ID: #${booking.id.toUpperCase()}`}
            back
          />
        </View>
        <StepIndicator steps={['Summary', 'Payment', 'Confirm']} currentIndex={1} />

        <View style={{ paddingHorizontal: spacing.base, gap: spacing.base }}>
          <Card variant="soft">
            <Text variant="h4">Trip Summary</Text>
            <View style={{ marginVertical: spacing.sm }}><Divider /></View>
            <View style={{ gap: spacing.sm }}>
              <Row label="Ride Type" value={`YB ${booking.fare.carTypeName}`} />
              <Row label="Distance" value={formatDistance(booking.fare.estimatedDistanceKm)} />
              <Row label="Base Fare" value={formatNairaExact(booking.fare.baseFare)} />
              <Row label="Surcharge" value={formatNairaExact(booking.fare.zoneSurcharge)} />
            </View>
            <View style={{ marginVertical: spacing.sm }}><Divider /></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">Total Amount</Text>
              <Text variant="h4">{formatNaira(total)}</Text>
            </View>
          </Card>

          {/* Paystack transfer card */}
          <Card
            variant="outlined"
            style={{ borderColor: colors.primary, borderWidth: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ fontSize: 20 }}>🏦</Text>
              <Text variant="bodyStrong">Pay via Bank Transfer</Text>
            </View>

            <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>
              Transfer the exact amount to the virtual account below. Your trip will be confirmed
              once funds reflect (usually within 30 seconds).
            </Text>

            <View
              style={{
                marginTop: spacing.md,
                padding: spacing.base,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.md,
                gap: spacing.sm,
              }}
            >
              <PayField label="Bank" value="Wema Bank" />
              <Divider />
              <PayField label="Account Number" value="9012 345 678" copyable />
              <Divider />
              <PayField label="Account Name" value="YB Ride / Paystack" />
              <Divider />
              <PayField label="Amount" value={formatNaira(total)} highlight />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                justifyContent: 'center',
                marginTop: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.accentSoft,
                borderRadius: radius.sm,
              }}
            >
              <Text>⏱</Text>
              <Text variant="small" color="warning" style={{ fontWeight: '600' }}>
                Account expires in {min}:{sec}
              </Text>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Button
                label={paying ? 'Confirming…' : "I've Paid"}
                onPress={onConfirmPaid}
                loading={paying}
                size="lg"
                variant="primary"
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                justifyContent: 'center',
                marginTop: spacing.sm,
              }}
            >
              <Text>🔒</Text>
              <Text variant="caption" color="muted">Secured by Paystack</Text>
            </View>
          </Card>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.xs,
              justifyContent: 'center',
              marginTop: spacing.sm,
            }}
          >
            <Text>🛡</Text>
            <Text variant="caption" color="muted">PCI-DSS Certified Payment Gateway</Text>
          </View>

          <Button
            label="Cancel and pick another ride"
            variant="ghost"
            onPress={() => navigation.popToTop()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
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

function PayField({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text variant="caption" color="muted">{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant={highlight ? 'h4' : 'bodyStrong'}>{value}</Text>
        {copyable && (
          <Text
            variant="smallStrong"
            color="primary"
            onPress={() => Alert.alert('Copied', `${value} copied to clipboard.`)}
          >
            Copy
          </Text>
        )}
      </View>
    </View>
  );
}
