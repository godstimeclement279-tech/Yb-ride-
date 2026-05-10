import React from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';

const FAQ = [
  {
    q: 'How are fares calculated?',
    a: 'Fares are fixed upfront — base fare + (km × per-km rate) + any zone surcharges that apply to the route. Round trips double the distance leg.',
  },
  {
    q: 'Can I pay with cash?',
    a: 'No. YB Ride is cashless. Pay via card or bank transfer through Paystack at booking.',
  },
  {
    q: 'How do I cancel a trip?',
    a: 'On the Trip Tracking screen tap "Cancel Trip". Cancellations after the driver has been dispatched may incur a small fee.',
  },
  {
    q: 'My driver hasn\'t arrived',
    a: 'Use "Call" on the trip tracking screen to reach your driver. If you can\'t reach them, contact YB Ride support.',
  },
];

export function HelpCenterScreen() {
  const { colors, spacing } = useTheme();

  return (
    <Screen scroll>
      <Header title="Help Center" back />

      <Card variant="soft">
        <Text variant="overline" color="muted">CONTACT</Text>
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <Button
            label="Call YB Ride support"
            variant="secondary"
            leading={<Text>📞</Text>}
            onPress={() => Linking.openURL('tel:+2348000000000')}
          />
          <Button
            label="Email support"
            variant="secondary"
            leading={<Text>✉</Text>}
            onPress={() => Linking.openURL('mailto:support@yb-ride.test')}
          />
          <Button
            label="WhatsApp"
            variant="secondary"
            leading={<Text>💬</Text>}
            onPress={() => Linking.openURL('https://wa.me/2348000000000')}
          />
        </View>
      </Card>

      <Text variant="overline" color="muted">FAQ</Text>
      <Card variant="soft" padded={false}>
        {FAQ.map((item, i) => (
          <React.Fragment key={item.q}>
            <View style={{ padding: spacing.base }}>
              <Text variant="bodyStrong">{item.q}</Text>
              <Text variant="small" color="muted" style={{ marginTop: 4 }}>
                {item.a}
              </Text>
            </View>
            {i < FAQ.length - 1 && <Divider inset={spacing.base} />}
          </React.Fragment>
        ))}
      </Card>
    </Screen>
  );
}
