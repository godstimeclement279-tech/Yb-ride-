import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
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
  MOCK_SEARCH_INDEX,
} from '../data/mockData';
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

  const matches = useMemo<Address[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_SEARCH_INDEX.filter(
      a => a.label.toLowerCase().includes(q) || a.formatted.toLowerCase().includes(q),
    );
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

  const nearby = MOCK_SEARCH_INDEX.slice(MOCK_SAVED_ADDRESSES.length + MOCK_RECENT_PLACES.length);

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
            onPress={() => {}}
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
              <Text variant="body" color="muted">No matches found</Text>
              <Text variant="small" color="subtle">Try a different keyword</Text>
            </View>
          ) : (
            matches.map(addr => (
              <ListItem
                key={addr.label}
                leading={<IconTile size={40} variant="card"><Text>📍</Text></IconTile>}
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
              leading={<IconTile size={40} variant="card"><Text>{iconForType(addr.type)}</Text></IconTile>}
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
              leading={<IconTile size={40} variant="card"><Text>🕐</Text></IconTile>}
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
                  leading={<IconTile size={40} variant="card"><Text>📍</Text></IconTile>}
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
  );
}
