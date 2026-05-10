import React from 'react';
import { Linking } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';

export function LegalScreen() {
  const { spacing } = useTheme();

  return (
    <Screen scroll>
      <Header title="Legal" back />

      <Card variant="soft" padded={false}>
        <ListItem
          leading={<IconTile size={44} variant="card"><Text>📄</Text></IconTile>}
          title="Terms of Service"
          subtitle="Rules for using YB Ride"
          showChevron
          onPress={() => Linking.openURL('https://yb-ride.test/terms')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile size={44} variant="card"><Text>🛡</Text></IconTile>}
          title="Privacy Policy"
          subtitle="How we handle your data"
          showChevron
          onPress={() => Linking.openURL('https://yb-ride.test/privacy')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile size={44} variant="card"><Text>♿</Text></IconTile>}
          title="Accessibility"
          subtitle="Our commitment to all riders"
          showChevron
          onPress={() => Linking.openURL('https://yb-ride.test/accessibility')}
          style={{ paddingHorizontal: spacing.base }}
        />
        <Divider inset={spacing.base + 44 + spacing.md} />
        <ListItem
          leading={<IconTile size={44} variant="card"><Text>🇳🇬</Text></IconTile>}
          title="Operating regions"
          subtitle="Currently serving Agbor, Delta State"
          showChevron
          onPress={() => Linking.openURL('https://yb-ride.test/regions')}
          style={{ paddingHorizontal: spacing.base }}
        />
      </Card>

      <Card variant="soft">
        <Text variant="caption" color="muted">© YB Ride · 2026 · Movement made easy.</Text>
      </Card>
    </Screen>
  );
}
