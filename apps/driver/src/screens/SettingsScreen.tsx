import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Divider } from '../components/Divider';
import { Pill } from '../components/Pill';
import { useTheme } from '../theme/ThemeProvider';

export function SettingsScreen() {
  const { mode, setMode, spacing } = useTheme();

  return (
    <Screen scroll>
      <Text variant="h2">Settings</Text>

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
          subtitle="Trip assignments and updates"
          trailing={<Text variant="small" color="muted">Coming soon</Text>}
        />
        <Divider inset={spacing.lg} />
        <ListItem
          title="Background location"
          subtitle="GPS share with dispatch while online"
          trailing={<Text variant="small" color="muted">Coming soon</Text>}
        />
      </Card>

      <Card>
        <Text variant="caption" color="muted">SUPPORT</Text>
        <Text variant="small" style={{ marginTop: spacing.xs }}>
          For password reset, account issues, or payouts, contact YB Ride dispatch.
        </Text>
      </Card>

      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text variant="caption" color="muted">YB Ride Driver · v0.0.1</Text>
      </View>
    </Screen>
  );
}
