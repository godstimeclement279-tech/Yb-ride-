import React from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';
import { formatNaira } from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const { spacing, colors } = useTheme();

  if (!user) return null;

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to receive trips.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Screen scroll>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="h2" style={{ color: colors.textInverse }}>
              {user.name.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{user.name}</Text>
            <Text variant="small" color="muted">{user.phone}</Text>
            <Text variant="small" color="muted">★ {user.averageRating?.toFixed(1) ?? '—'} · {user.totalTrips} trips</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="caption" color="muted">LIFETIME</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Text variant="small" color="muted">Total earnings</Text>
          <Text variant="bodyStrong">{formatNaira(user.totalEarningsKobo)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
          <Text variant="small" color="muted">Total trips</Text>
          <Text variant="bodyStrong">{user.totalTrips}</Text>
        </View>
      </Card>

      <Card padded={false}>
        <ListItem
          leading={<Text>🚗</Text>}
          title="Vehicle"
          subtitle={`${user.vehicle.color} ${user.vehicle.make} ${user.vehicle.model} · ${user.vehicle.plate}`}
          onPress={() => navigation.navigate('Vehicle')}
        />
        <Divider inset={spacing.lg} />
        <ListItem
          leading={<Text>📄</Text>}
          title="Documents"
          subtitle={user.documents.verifiedAt ? 'Verified' : 'Pending verification'}
          onPress={() => navigation.navigate('Documents')}
        />
        <Divider inset={spacing.lg} />
        <ListItem
          leading={<Text>⚙</Text>}
          title="Settings"
          subtitle="Theme, notifications"
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>

      <Button label="Sign out" onPress={onSignOut} variant="danger" />

      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text variant="caption" color="muted">
          Driver ID: {user.id}
        </Text>
      </View>
    </Screen>
  );
}
