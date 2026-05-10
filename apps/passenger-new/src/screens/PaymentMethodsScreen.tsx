import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { IconTile } from '../components/IconTile';
import { Badge } from '../components/Badge';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';

// MVP: bank transfer via Paystack is the only payment method.
// Card support arrives post-MVP — when it ships, the active method becomes
// configurable on this screen.

export function PaymentMethodsScreen() {
  const { spacing } = useTheme();

  return (
    <Screen scroll>
      <Header title="Payment Methods" back />

      <Text variant="overline" color="muted">ACTIVE METHOD</Text>

      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconTile size={48} variant="card">
            <Text style={{ fontSize: 22 }}>🏦</Text>
          </IconTile>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="bodyStrong">Bank Transfer</Text>
              <Badge label="DEFAULT" tone="primary" />
            </View>
            <Text variant="small" color="muted">
              Paystack virtual account · pay before each ride
            </Text>
          </View>
        </View>

        <View style={{ marginVertical: spacing.md }}>
          <Divider />
        </View>

        <Text variant="small" color="muted">
          A unique virtual account is generated for each trip. Transfer the exact fare amount;
          your trip is confirmed when funds reflect (~30 seconds).
        </Text>
      </Card>

      <Text variant="overline" color="muted">COMING SOON</Text>
      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, opacity: 0.65 }}>
          <IconTile size={48} variant="surface">
            <Text style={{ fontSize: 22 }}>💳</Text>
          </IconTile>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong">Card Payment</Text>
            <Text variant="small" color="muted">
              Visa, Mastercard, Verve via Paystack
            </Text>
          </View>
          <Badge label="SOON" tone="neutral" />
        </View>
      </Card>

      <Card variant="soft">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Text>🔒</Text>
          <Text variant="small" color="muted" style={{ flex: 1 }}>
            All payments are processed and secured by Paystack. YB Ride never stores your bank
            credentials.
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
