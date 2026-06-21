import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SavedAddress } from '@yb/shared';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { SectionLabel } from '../components/SectionLabel';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';
import { usePassenger } from '../context/AuthContext';
import { subscribeSavedAddresses } from '../services/firebase/savedAddressesService';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TYPE_ICON: Record<string, string> = {
  home: '🏠',
  work: '💼',
  other: '📍',
};

export function SavedAddressesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const user = usePassenger();

  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);

  // Live subscription on /users/{uid}/savedAddresses — keeps the list fresh
  // when AddAddress saves or another device edits.
  useEffect(() => {
    return subscribeSavedAddresses(user.id, setAddresses);
  }, [user.id]);

  const loading = addresses === null;
  const favorites = (addresses ?? []).filter(
    (a) => a.type === 'home' || a.type === 'work',
  );
  const others = (addresses ?? []).filter((a) => a.type === 'other');

  return (
    <Screen scroll>
      <Header
        title="Saved Addresses"
        back
        trailing={<Text variant="h3">?</Text>}
      />

      <Card
        variant="soft"
        onPress={() => navigation.navigate('AddAddress')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <IconTile variant="soft" size={48}>
            <Text>📍+</Text>
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Add New Address</Text>
            <Text variant="small" color="muted">Set a new frequent destination</Text>
          </View>
          <Text variant="body" color="subtle">›</Text>
        </View>
      </Card>

      {loading && (
        <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && favorites.length > 0 && (
        <>
          <SectionLabel label="Favorites" />
          <Card variant="soft" padded={false}>
            {favorites.map((addr, i) => (
              <React.Fragment key={addr.id}>
                <ListItem
                  leading={<IconTile variant="soft" size={44}><Text>{TYPE_ICON[addr.type]}</Text></IconTile>}
                  title={addr.label}
                  subtitle={addr.formatted}
                  trailing={
                    <Text variant="body" color="subtle">≡</Text>
                  }
                  onPress={() => navigation.navigate('AddAddress', { address: addr })}
                  style={{ paddingHorizontal: spacing.base }}
                />
                {i < favorites.length - 1 && <Divider inset={spacing.base + 44 + spacing.md} />}
              </React.Fragment>
            ))}
          </Card>
        </>
      )}

      {!loading && others.length > 0 && (
        <>
          <SectionLabel label="Other Saved Locations" />
          <Card variant="soft" padded={false}>
            {others.map((addr, i) => (
              <React.Fragment key={addr.id}>
                <ListItem
                  leading={<IconTile variant="soft" size={44}><Text>📍</Text></IconTile>}
                  title={addr.label}
                  subtitle={addr.formatted}
                  trailing={<Text variant="body" color="subtle">≡</Text>}
                  onPress={() => navigation.navigate('AddAddress', { address: addr })}
                  style={{ paddingHorizontal: spacing.base }}
                />
                {i < others.length - 1 && <Divider inset={spacing.base + 44 + spacing.md} />}
              </React.Fragment>
            ))}
          </Card>
        </>
      )}

      {!loading && favorites.length === 0 && others.length === 0 && (
        <View
          style={{
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <IconTile variant="soft" size={64}>
            <Text style={{ fontSize: 28 }}>🏠</Text>
          </IconTile>
          <Text variant="bodyStrong" style={{ marginTop: spacing.sm }}>
            No saved places yet
          </Text>
          <Text
            variant="small"
            color="muted"
            style={{ textAlign: 'center', lineHeight: 20, maxWidth: 280 }}
          >
            Tap "Add New Address" above to save home, work, or anywhere else
            you ride to often.
          </Text>
        </View>
      )}

      <View
        style={{
          marginTop: spacing.lg,
          padding: spacing.base,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'flex-start',
        }}
      >
        <Text>💡</Text>
        <Text variant="small" color="muted" style={{ flex: 1 }}>
          Saving addresses helps you book rides faster without typing your destination every time.
          Tap a saved place to edit or remove it.
        </Text>
      </View>
    </Screen>
  );
}
