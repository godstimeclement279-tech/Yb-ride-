import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { SectionLabel } from '../components/SectionLabel';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';
import { MOCK_SAVED_ADDRESSES } from '../data/mockData';
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

  const favorites = MOCK_SAVED_ADDRESSES.filter(a => a.type === 'home' || a.type === 'work');
  const others = MOCK_SAVED_ADDRESSES.filter(a => a.type === 'other');

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
          <IconTile variant="card" size={48}>
            <Text>📍+</Text>
          </IconTile>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">Add New Address</Text>
            <Text variant="small" color="muted">Set a new frequent destination</Text>
          </View>
          <Text variant="body" color="subtle">›</Text>
        </View>
      </Card>

      <SectionLabel label="Favorites" />
      <Card variant="soft" padded={false}>
        {favorites.map((addr, i) => (
          <React.Fragment key={addr.id}>
            <ListItem
              leading={<IconTile variant="card" size={44}><Text>{TYPE_ICON[addr.type]}</Text></IconTile>}
              title={addr.label}
              subtitle={addr.formatted}
              trailing={
                <Text variant="body" color="subtle">≡</Text>
              }
              onPress={() => navigation.navigate('AddAddress', { addressId: addr.id })}
              style={{ paddingHorizontal: spacing.base }}
            />
            {i < favorites.length - 1 && <Divider inset={spacing.base + 44 + spacing.md} />}
          </React.Fragment>
        ))}
      </Card>

      {others.length > 0 && (
        <>
          <SectionLabel label="Other Saved Locations" />
          <Card variant="soft" padded={false}>
            {others.map((addr, i) => (
              <React.Fragment key={addr.id}>
                <ListItem
                  leading={<IconTile variant="card" size={44}><Text>📍</Text></IconTile>}
                  title={addr.label}
                  subtitle={addr.formatted}
                  trailing={<Text variant="body" color="subtle">≡</Text>}
                  onPress={() => navigation.navigate('AddAddress', { addressId: addr.id })}
                  style={{ paddingHorizontal: spacing.base }}
                />
                {i < others.length - 1 && <Divider inset={spacing.base + 44 + spacing.md} />}
              </React.Fragment>
            ))}
          </Card>
        </>
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
        </Text>
      </View>
    </Screen>
  );
}
