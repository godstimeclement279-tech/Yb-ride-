import React, { useMemo, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { OfferCard } from '../components/OfferCard';
import { useTheme } from '../theme/ThemeProvider';
import { useRide } from '../context/RideContext';
import type { Promo } from '@yb/shared';

function expiresLabel(promo: Promo, now = Date.now()): string {
  const remaining = promo.expiresAt - now;
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.ceil(remaining / dayMs);
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Ends tomorrow';
  if (days === 2) return 'Ends in 2d';
  if (days <= 7) {
    const dow = new Date(promo.expiresAt).toLocaleDateString('en-US', { weekday: 'long' });
    return `Ends ${dow}`;
  }
  return `Valid ${days}d`;
}

function describePromo(promo: Promo): string {
  if (promo.kind === 'percentage') {
    const cap =
      promo.maxDiscount != null ? ` Max discount ₦${(promo.maxDiscount / 100).toLocaleString()}.` : '';
    const min =
      promo.minTripAmount != null ? ` Min trip ₦${(promo.minTripAmount / 100).toLocaleString()}.` : '';
    return `Save ${promo.value}% on rides.${cap}${min}`;
  }
  return `Get ₦${(promo.value / 100).toLocaleString()} off your next ride.`;
}

export function PromoCodesScreen() {
  const navigation = useNavigation();
  const { colors, spacing, radius, typography } = useTheme();
  const { promos, applyPromoCode, appliedPromo, clearPromo } = useRide();
  const [code, setCode] = useState('');

  const apply = () => {
    const result = applyPromoCode(code);
    if (!result.ok) {
      Alert.alert('Promo error', result.reason ?? 'Could not apply');
      return;
    }
    setCode('');
    Alert.alert('Promo applied', 'It will be used on your next ride.');
  };

  return (
    <Screen scroll>
      <Header title="Promo Codes" back />

      <View style={{ gap: spacing.sm }}>
        <Text variant="h4">Have a promo code?</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              paddingHorizontal: spacing.base,
              paddingVertical: spacing.md,
              minHeight: 52,
              justifyContent: 'center',
            }}
          >
            <TextInput
              value={code}
              onChangeText={s => setCode(s.toUpperCase())}
              placeholder="Enter code (e.g. YBRIDE50)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ color: colors.text, ...typography.body, padding: 0 }}
            />
          </View>
          <View style={{ minWidth: 100 }}>
            <Button label="Apply" variant="primary" onPress={apply} fullWidth={false} />
          </View>
        </View>
      </View>

      {appliedPromo && (
        <Card variant="soft" style={{ borderColor: colors.success, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text variant="caption" color="success" style={{ fontWeight: '700' }}>APPLIED</Text>
              <Text variant="bodyStrong">{appliedPromo.code}</Text>
            </View>
            <Button label="Remove" variant="ghost" onPress={clearPromo} fullWidth={false} />
          </View>
        </Card>
      )}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.md,
        }}
      >
        <Text variant="h4">Available Offers</Text>
        <Text variant="bodyStrong">{promos.length} Available</Text>
      </View>

      {promos.map(p => (
        <OfferCard
          key={p.id}
          code={p.code}
          description={describePromo(p)}
          expiresLabel={expiresLabel(p)}
          onPress={() => {
            const result = applyPromoCode(p.code);
            if (result.ok) {
              Alert.alert('Promo applied', `${p.code} will be used on your next ride.`);
            }
          }}
        />
      ))}

      <Card variant="soft" style={{ marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Text>ⓘ</Text>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">How to use promos</Text>
            <Text variant="small" color="muted" style={{ marginTop: spacing.xs }}>
              Promos are automatically applied to your next eligible trip unless manually deselected during booking.
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
