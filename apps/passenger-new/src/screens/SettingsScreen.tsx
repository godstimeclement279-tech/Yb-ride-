import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';

export function SettingsScreen() {
  const { mode, setMode, spacing } = useTheme();

  return (
    <Screen scroll>
      <Header title="Settings" back />

      <Card variant="soft">
        <Text variant="bodyStrong">Theme</Text>
        <Text variant="small" color="muted">Light, dark, or follow system.</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Pill label="Light" active={mode === 'light'} onPress={() => setMode('light')} />
          <Pill label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} />
          <Pill label="System" onPress={() => setMode('system')} />
        </View>
      </Card>

      <Card variant="soft">
        <Text variant="overline" color="muted">PREFERENCES</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <Row label="Language" value="English (Nigeria)" />
          <Divider />
          <Row label="Distance unit" value="Kilometers" />
          <Divider />
          <Row label="Currency" value="Naira (NGN)" />
        </View>
      </Card>

      <Card variant="soft">
        <Text variant="overline" color="muted">SUPPORT</Text>
        <Text variant="small" style={{ marginTop: spacing.sm }} color="muted">
          For payment, account, or trip issues, contact YB Ride support via the Help Center.
        </Text>
      </Card>

      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text variant="caption" color="subtle">YB Ride · v0.0.1</Text>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="small" color="muted">{label}</Text>
      <Text variant="smallStrong">{value}</Text>
    </View>
  );
}
