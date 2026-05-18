import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { SearchBar } from '../components/SearchBar';
import { Map } from '../components/Map';
import { BottomSheet } from '../components/BottomSheet';
import { CarOptionCard } from '../components/CarOptionCard';
import { ListItem } from '../components/ListItem';
import { Pill } from '../components/Pill';
import { Badge } from '../components/Badge';
import { IconButton } from '../components/IconButton';
import { IconTile } from '../components/IconTile';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useRide } from '../context/RideContext';
import {
  MOCK_ETA_SECONDS,
  MOCK_RECENT_PLACES,
  MOCK_SAVED_ADDRESSES,
} from '../data/mockData';
import { formatNaira } from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Pick a recent-place glyph from the label keyword.
function iconForPlace(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('hospital') || l.includes('clinic')) return '🏥';
  if (l.includes('market') || l.includes('mall') || l.includes('shop')) return '🛒';
  if (l.includes('school') || l.includes('university') || l.includes('college')) return '🎓';
  if (l.includes('airport')) return '✈️';
  if (l.includes('park')) return '🌳';
  if (l.includes('church') || l.includes('mosque')) return '⛪';
  if (l.includes('restaurant') || l.includes('cafe')) return '🍽️';
  if (l.includes('hotel') || l.includes('lodge')) return '🏨';
  return '📍';
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    pickup,
    dropoff,
    carType,
    isRoundTrip,
    setIsRoundTrip,
    setCarType,
    setDropoff,
    carTypes,
    fareByCarType,
    appliedPromo,
    totalAfterPromoKobo,
  } = useRide();
  const [creating, setCreating] = useState(false);
  const [sheetCollapsed, setSheetCollapsed] = useState(true);

  const showRideSelector = !!dropoff;

  const onConfirm = async () => {
    setCreating(true);
    try {
      navigation.navigate('FareBreakdown');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <Map
          style={{ flex: 1 }}
          pickup={pickup?.point}
          dropoff={dropoff?.point}
          showRoute={showRideSelector}
          bottomPadding={300}
        />

        {/* Top bar — menu + brand + bell */}
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
            <IconButton glyph="≡" onPress={() => navigation.navigate('Settings')} accessibilityLabel="Menu" />
            <View
              style={{
                backgroundColor: colors.card,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.pill,
              }}
            >
              <Text variant="bodyStrong" color="primary">YB Ride</Text>
            </View>
            <IconButton glyph="◇" onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Notifications" />
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom sheet — tap drag handle to expand/collapse */}
      <BottomSheet
        style={{ paddingBottom: insets.bottom + spacing.lg }}
        onToggle={() => setSheetCollapsed(c => !c)}
        collapsed={sheetCollapsed && !showRideSelector}
      >
        {!showRideSelector ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: sheetCollapsed ? 240 : 480 }}
          >
            {!sheetCollapsed && (
              <>
                <Text variant="h2">Hi, {user.name.split(' ')[0]}</Text>
                <Text variant="small" color="muted" style={{ marginBottom: spacing.base }}>
                  Where are we going today?
                </Text>
              </>
            )}

            {/* Pickup row */}
            <Pressable
              onPress={() => navigation.navigate('LocationSearch', { mode: 'pickup' })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.base,
                paddingVertical: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                marginBottom: spacing.sm,
                minHeight: 52,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: colors.text,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="muted">From</Text>
                <Text variant="body" numberOfLines={1}>
                  {pickup?.label ?? 'Current location'}
                </Text>
              </View>
              <Text variant="body" color="subtle">›</Text>
            </Pressable>

            {/* Destination input */}
            <SearchBar
              placeholder="Where to?"
              variant="filled"
              value=""
              onPress={() => navigation.navigate('LocationSearch', { mode: 'dropoff' })}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              {MOCK_SAVED_ADDRESSES.map(addr => (
                <Pill
                  key={addr.id}
                  label={addr.label}
                  leading={<Text>{addr.type === 'home' ? '🏠' : '💼'}</Text>}
                  onPress={() => setDropoff(addr)}
                />
              ))}
            </View>

            {!sheetCollapsed && (
              <View style={{ marginTop: spacing.lg }}>
                <Text
                  variant="overline"
                  color="muted"
                  style={{ marginBottom: spacing.sm }}
                >
                  RECENT
                </Text>
                {MOCK_RECENT_PLACES.slice(0, 3).map(place => (
                  <ListItem
                    key={place.label}
                    leading={
                      <IconTile size={40} variant="card">
                        <Text>{iconForPlace(place.label)}</Text>
                      </IconTile>
                    }
                    title={place.label}
                    subtitle={place.formatted}
                    onPress={() => setDropoff(place)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 560 }}
          >
            <Text variant="h2" style={{ marginBottom: spacing.md }}>Select Ride</Text>

            {/* Pickup + dropoff card — both rows tappable to edit */}
            <View
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.lg,
                padding: spacing.base,
                gap: spacing.sm,
              }}
            >
              <Pressable
                onPress={() => navigation.navigate('LocationSearch', { mode: 'pickup' })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: colors.text,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="muted">Pickup Location</Text>
                  <Text variant="body" numberOfLines={1}>
                    {pickup?.label ?? 'Choose pickup'}
                  </Text>
                </View>
                <Text variant="body" color="subtle">›</Text>
              </Pressable>
              <View style={{ marginLeft: 7, height: 16, width: 2, backgroundColor: colors.border }} />
              <Pressable
                onPress={() => navigation.navigate('LocationSearch', { mode: 'dropoff' })}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: colors.dropoff,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="muted">Destination</Text>
                  <Text variant="body" numberOfLines={1}>
                    {dropoff!.label}
                  </Text>
                </View>
                <Text variant="body" color="subtle">›</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <Pill label="One-way" active={!isRoundTrip} onPress={() => setIsRoundTrip(false)} />
              <Pill label="Round trip" active={isRoundTrip} onPress={() => setIsRoundTrip(true)} />
            </View>

            <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
              {carTypes.map(ct => (
                <CarOptionCard
                  key={ct.id}
                  carType={ct}
                  fare={fareByCarType[ct.id]}
                  selected={carType?.id === ct.id}
                  onPress={() => setCarType(ct)}
                  etaSeconds={MOCK_ETA_SECONDS[ct.id]}
                  badge="FASTEST"
                  promo={appliedPromo ? 'Promo' : undefined}
                />
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: spacing.lg,
                paddingHorizontal: spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text>🏦</Text>
                <Text variant="bodyStrong">Bank Transfer · Paystack</Text>
              </View>
              {appliedPromo && <Badge label="Promo Applied" tone="success" />}
            </View>

            <View style={{ height: spacing.lg }} />
            <Button
              label={
                carType && totalAfterPromoKobo
                  ? `Confirm ${carType.name} · ${formatNaira(totalAfterPromoKobo)}`
                  : 'Confirm'
              }
              onPress={onConfirm}
              loading={creating}
              size="lg"
              variant="primary"
            />
          </ScrollView>
        )}
      </BottomSheet>
    </View>
  );
}
