import React from 'react';
import { Alert, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Divider } from '../components/Divider';
import { Pill } from '../components/Pill';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';

export function SettingsScreen() {
  const { mode, setMode, spacing } = useTheme();
  const { signOut } = useAuth();

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You will go offline and need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() => {
            Alert.alert('Could not sign out', 'Try again in a moment.');
          });
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <Card padded={false}>
        <View style={{ padding: spacing.base }}>
          <Text variant="bodyStrong">Theme</Text>
          <Text variant="caption" color="muted">Light, dark, or system default.</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <Pill label="Light" active={mode === 'light'} onPress={() => setMode('light')} />
            <Pill label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} />
            <Pill label="System" onPress={() => setMode('system')} />
          </View>
        </View>
      </Card>

      <Card padded={false}>
        <ListItem
          title="Push notifications"
          subtitle="Trip assignments + status updates"
          trailing={<Text variant="small" color="success">Enabled</Text>}
        />
        <Divider inset={spacing.lg} />
        <ListItem
          title="Background location"
          subtitle="GPS shared with dispatch while online"
          trailing={<Text variant="small" color="success">Enabled</Text>}
        />
      </Card>

      <Card>
        <Text variant="caption" color="muted">SUPPORT</Text>
        <Text variant="small" style={{ marginTop: spacing.xs }}>
          For password reset, account issues, or payouts, contact YB Ride dispatch.
        </Text>
      </Card>

      <Button label="Sign out" variant="danger" onPress={onSignOut} />

      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text variant="caption" color="muted">YB Ride Driver · v0.1.0</Text>
      </View>
    </Screen>
  );
}
