import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { SectionLabel } from '../components/SectionLabel';
import { Header } from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';
import { useRide } from '../context/RideContext';
import {
  MOCK_CURRENT_LOCATION,
  MOCK_RECENT_PLACES,
  MOCK_SAVED_ADDRESSES,
} from '../data/mockData';
import { searchPlaces } from '../services/google';
import type { Address } from '@yb/shared';
import type { LocationSearchMode, RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LocationSearch'>;

export function LocationSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialMode = route.params.mode;
  const { colors, spacing, radius, typography } = useTheme();
  const { pickup, dropoff, setPickup, setDropoff } = useRide();

  const [activeMode, setActiveMode] = useState<LocationSearchMode>(initialMode);
  const [pickupQuery, setPickupQuery] = useState(pickup?.label ?? '');
  const [dropoffQuery, setDropoffQuery] = useState(dropoff?.label ?? '');

  const pickupRef = useRef<TextInput>(null);
  const dropoffRef = useRef<TextInput>(null);

  // Focus the field that matches the mode the screen was opened in.
  useEffect(() => {
    const t = setTimeout(() => {
      if (initialMode === 'pickup') pickupRef.current?.focus();
      else dropoffRef.current?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [initialMode]);

  const query = activeMode === 'pickup' ? pickupQuery : dropoffQuery;

  // Real forward geocoding via Mapbox, debounced. Replaces the old mock-list
  // filter so users can find any real street/place in/around Agbor.
  const [matches, setMatches] = useState<Address[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setMatches([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const results = await searchPlaces(q);
      if (cancelled) return;
      setMatches(results);
      setSearching(false);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const pick = (addr: Address) => {
    if (activeMode === 'pickup') {
      setPickup(addr);
      setPickupQuery(addr.label);
    } else {
      setDropoff(addr);
      setDropoffQuery(addr.label);
    }
    navigation.goBack();
  };

  const useCurrent = () => {
    setPickup(MOCK_CURRENT_LOCATION);
    setPickupQuery(MOCK_CURRENT_LOCATION.label);
    if (activeMode === 'pickup') navigation.goBack();
  };

  const iconForType = (type: string): string =>
    type === 'home' ? '🏠' : type === 'work' ? '💼' : '⭐';

  // Nearby suggestions removed — they were mock entries. Search now hits real
  // Mapbox geocoding, and Saved/Recent below remain the curated shortcuts.
  const nearby: Address[] = [];

  const fieldStyle = (active: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: active ? colors.text : colors.border,
    borderRadius: radius.md,
    minHeight: 52,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen background="background" scroll edges={['top', 'bottom']}>
      <Header title="Select Location" back />

      {/* Pickup + Destination — both editable. The active field has a stronger border. */}
      <View style={{ gap: spacing.sm, paddingTop: spacing.sm }}>
        <View>
          <Text variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
            Pickup
          </Text>
          <Pressable
            onPress={() => {
              setActiveMode('pickup');
              pickupRef.current?.focus();
            }}
            style={fieldStyle(activeMode === 'pickup')}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: colors.text,
              }}
            />
            <TextInput
              ref={pickupRef}
              value={pickupQuery}
              onChangeText={setPickupQuery}
              onFocus={() => setActiveMode('pickup')}
              placeholder="Pickup location"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              style={{ flex: 1, color: colors.text, ...typography.body, padding: 0 }}
            />
            {pickupQuery !== '' && (
              <Pressable onPress={() => setPickupQuery('')} hitSlop={8}>
                <Text color="muted">×</Text>
              </Pressable>
            )}
          </Pressable>
        </View>

        <View>
          <Text variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
            Destination
          </Text>
          <Pressable
            onPress={() => {
              setActiveMode('dropoff');
              dropoffRef.current?.focus();
            }}
            style={fieldStyle(activeMode === 'dropoff')}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: colors.dropoff,
              }}
            />
            <TextInput
              ref={dropoffRef}
              value={dropoffQuery}
              onChangeText={setDropoffQuery}
              onFocus={() => setActiveMode('dropoff')}
              placeholder="Where to?"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              style={{ flex: 1, color: colors.text, ...typography.body, padding: 0 }}
            />
            {dropoffQuery !== '' && (
              <Pressable onPress={() => setDropoffQuery('')} hitSlop={8}>
                <Text color="muted">×</Text>
              </Pressable>
            )}
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Set on Map"
            variant="secondary"
            leading={<Text>🗺</Text>}
            onPress={() => navigation.navigate('MapPicker', { mode: activeMode })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Current"
            variant="secondary"
            leading={<Text>➤</Text>}
            onPress={useCurrent}
          />
        </View>
      </View>

      {query.trim() ? (
        <>
          <SectionLabel
            label={`Search for ${activeMode === 'pickup' ? 'Pickup' : 'Destination'}`}
          />
          {matches.length === 0 ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
              {searching ? (
                <Text variant="body" color="muted">Searching…</Text>
              ) : (
                <>
                  <Text variant="body" color="muted">No matches found</Text>
                  <Text variant="small" color="subtle">Try a different keyword</Text>
                </>
              )}
            </View>
          ) : (
            matches.map((addr, i) => (
              <ListItem
                // Google can return two results with the same display name
                // (e.g. multiple branches of "Am Sexy"). Use placeId when
                // available + index fallback so React keys stay unique.
                key={addr.placeId ?? `${addr.label}-${i}`}
                leading={<IconTile size={44} variant="soft"><Text>📍</Text></IconTile>}
                title={addr.label}
                subtitle={addr.formatted}
                onPress={() => pick(addr)}
                showChevron
              />
            ))
          )}
        </>
      ) : (
        <>
          <SectionLabel label="Saved Places" trailing={<Text variant="smallStrong">Edit</Text>} />
          {MOCK_SAVED_ADDRESSES.map(addr => (
            <ListItem
              key={addr.id}
              leading={<IconTile size={44} variant="soft"><Text>{iconForType(addr.type)}</Text></IconTile>}
              title={addr.label}
              subtitle={addr.formatted}
              onPress={() => pick(addr)}
              showChevron
            />
          ))}

          <SectionLabel label="Recent" />
          {MOCK_RECENT_PLACES.map(place => (
            <ListItem
              key={place.label}
              leading={<IconTile size={44} variant="soft"><Text>🕐</Text></IconTile>}
              title={place.label}
              subtitle={place.formatted}
              onPress={() => pick(place)}
              showChevron
            />
          ))}

          {nearby.length > 0 && (
            <>
              <SectionLabel label="Nearby" />
              {nearby.map(place => (
                <ListItem
                  key={place.label}
                  leading={<IconTile size={44} variant="soft"><Text>📍</Text></IconTile>}
                  title={place.label}
                  subtitle={place.formatted}
                  onPress={() => pick(place)}
                  showChevron
                />
              ))}
            </>
          )}
        </>
      )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
