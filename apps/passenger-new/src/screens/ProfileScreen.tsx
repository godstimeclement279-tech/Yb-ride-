import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { Avatar } from '../components/Avatar';
import { SectionLabel } from '../components/SectionLabel';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';
import { usePassenger, useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = usePassenger();
  const { signOut } = useAuth();
  const { spacing } = useTheme();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  const doSignOut = () => {
    setSignOutOpen(false);
    signOut().catch(() => setSignOutError(true));
  };

  return (
    <Screen scroll>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="h1">Profile</Text>
        <ListItem
          title=""
          leading={
            <IconTile size={40} variant="soft" rounded="tile">
              <Text>✎</Text>
            </IconTile>
          }
          onPress={() => navigation.navigate('EditProfile')}
        />
      </View>

      {/* Avatar header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.base,
          paddingVertical: spacing.md,
        }}
      >
        <Avatar name={user.name} size={68} online />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="h3">{user.name}</Text>
          <Text variant="small" color="muted">{user.phone}</Text>
          {/* Verified badge removed — the passenger user model has no
              verification concept (only driver docs do). Re-add behind a
              real `user.verifiedAt` field once one exists. */}
        </View>
      </View>

      <Divider />

      <SectionLabel label="Account" />
      <Card variant="soft" padded={false}>
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>🏠</Text></IconTile>}
          title="Saved Addresses"
          subtitle="Home, Work, and more"
          showChevron
          onPress={() => navigation.navigate('SavedAddresses')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>🏦</Text></IconTile>}
          title="Payment Methods"
          subtitle="Bank Transfer · Paystack"
          showChevron
          onPress={() => navigation.navigate('PaymentMethods')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>🏷</Text></IconTile>}
          title="Promo Codes"
          subtitle="3 available rewards"
          showChevron
          onPress={() => navigation.navigate('PromoCodes')}
          style={{ paddingHorizontal: spacing.base }}
        />
      </Card>

      <SectionLabel label="Preferences" />
      <Card variant="soft" padded={false}>
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>🕐</Text></IconTile>}
          title="Ride History"
          subtitle="View past trips and receipts"
          showChevron
          onPress={() => navigation.getParent()?.navigate('History' as never)}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>🔔</Text></IconTile>}
          title="Notifications"
          subtitle="Manage alerts and updates"
          showChevron
          onPress={() => navigation.navigate('Notifications')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>🛡</Text></IconTile>}
          title="Privacy & Security"
          subtitle="Data and account protection"
          showChevron
          onPress={() => navigation.navigate('Privacy')}
          style={{ paddingHorizontal: spacing.base }}
        />
      </Card>

      <SectionLabel label="Support" />
      <Card variant="soft" padded={false}>
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>?</Text></IconTile>}
          title="Help Center"
          subtitle="FAQ and contact support"
          showChevron
          onPress={() => navigation.navigate('HelpCenter')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>📄</Text></IconTile>}
          title="Legal"
          subtitle="Terms of service and policies"
          showChevron
          onPress={() => navigation.navigate('Legal')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile variant="soft" size={44}><Text>⚙</Text></IconTile>}
          title="Settings"
          subtitle="Theme and preferences"
          showChevron
          onPress={() => navigation.navigate('Settings')}
          style={{ paddingHorizontal: spacing.base }}
        />
      </Card>

      <Button label="Sign out" variant="danger" onPress={() => setSignOutOpen(true)} />

      <ConfirmDialog
        visible={signOutOpen}
        title="Sign out?"
        message="You will need to sign in again to book rides."
        confirmLabel="Sign out"
        confirmTone="danger"
        onConfirm={doSignOut}
        onCancel={() => setSignOutOpen(false)}
      />

      <ConfirmDialog
        visible={signOutError}
        title="Could not sign out"
        message="Try again in a moment."
        confirmLabel="OK"
        cancelLabel=""
        onConfirm={() => setSignOutError(false)}
        onCancel={() => setSignOutError(false)}
      />

      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Text variant="caption" color="subtle">
          YB Ride · v0.0.1 · Made with ♥
        </Text>
      </View>
    </Screen>
  );
}
