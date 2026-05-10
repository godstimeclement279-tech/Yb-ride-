import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Divider } from '../components/Divider';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

export function VehicleScreen() {
  const { user } = useAuth();
  const { spacing } = useTheme();

  if (!user) return null;
  const v = user.vehicle;

  return (
    <Screen scroll>
      <Text variant="h2">Vehicle</Text>
      <Text variant="small" color="muted">
        These details were registered with admin. Contact dispatch to update.
      </Text>

      <Card>
        <Row label="Make" value={v.make} />
        <Sep />
        <Row label="Model" value={v.model} />
        <Sep />
        <Row label="Year" value={String(v.year)} />
        <Sep />
        <Row label="Color" value={v.color} />
        <Sep />
        <Row label="Plate" value={v.plate} />
        <Sep />
        <Row label="Car type" value={user.carTypeId} />
      </Card>

      <Card>
        <Text variant="caption" color="muted">VERIFICATION</Text>
        <Text variant="small" style={{ marginTop: spacing.xs }}>
          {user.documents.verifiedAt
            ? `Verified by admin on ${new Date(user.documents.verifiedAt).toLocaleDateString()}.`
            : 'Awaiting admin verification.'}
        </Text>
      </Card>
    </Screen>
  );
}

function Sep() {
  const { spacing } = useTheme();
  return <View style={{ marginVertical: spacing.xs }}><Divider /></View>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text variant="small" color="muted">{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}
