import React from 'react';
import { Alert, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';

export function PrivacyScreen() {
  const { spacing } = useTheme();

  return (
    <Screen scroll>
      <Header title="Privacy & Security" back />

      <Card variant="soft" padded={false}>
        <Section title="Account">
          <ListItem
            leading={<IconTile size={44} variant="card"><Text>🔑</Text></IconTile>}
            title="Change password"
            subtitle="Update your account password"
            showChevron
            onPress={() => Alert.alert('Coming soon')}
            style={{ paddingHorizontal: spacing.base }}
          />
          <Divider inset={spacing.base + 44 + spacing.md} />
          <ListItem
            leading={<IconTile size={44} variant="card"><Text>📱</Text></IconTile>}
            title="2-step verification"
            subtitle="Add SMS as a second factor"
            showChevron
            onPress={() => Alert.alert('Coming soon')}
            style={{ paddingHorizontal: spacing.base }}
          />
        </Section>
      </Card>

      <Card variant="soft" padded={false}>
        <Section title="Data">
          <ListItem
            leading={<IconTile size={44} variant="card"><Text>📥</Text></IconTile>}
            title="Download my data"
            subtitle="Receive a copy of your trips and account"
            showChevron
            onPress={() => Alert.alert('Coming soon')}
            style={{ paddingHorizontal: spacing.base }}
          />
          <Divider inset={spacing.base + 44 + spacing.md} />
          <ListItem
            leading={<IconTile size={44} variant="card"><Text>🗑</Text></IconTile>}
            title="Delete account"
            subtitle="Permanently remove your account and data"
            showChevron
            onPress={() =>
              Alert.alert('Are you sure?', 'This is irreversible.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' },
              ])
            }
            style={{ paddingHorizontal: spacing.base }}
          />
        </Section>
      </Card>

      <Card variant="soft">
        <Text variant="small" color="muted">
          YB Ride only stores trip and profile data necessary to operate the service.
          GPS location is captured during active trips and discarded shortly after.
        </Text>
      </Card>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View>
      <Text
        variant="overline"
        color="muted"
        style={{ paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.xs }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
