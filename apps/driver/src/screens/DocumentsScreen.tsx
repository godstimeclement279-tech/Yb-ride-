import React from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Divider } from '../components/Divider';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeProvider';

export function DocumentsScreen() {
  const { user } = useAuth();
  const { spacing, colors } = useTheme();

  if (!user) return null;
  const d = user.documents;

  const Status = ({ ok }: { ok: boolean }) => (
    <Text variant="small" style={{ color: ok ? colors.success : colors.warning, fontWeight: '600' }}>
      {ok ? 'On file' : 'Missing'}
    </Text>
  );

  return (
    <Screen scroll>
      <Text variant="h2">Documents</Text>
      <Text variant="small" color="muted">
        Upload of new documents is admin-managed for now.
      </Text>

      <Card padded={false}>
        <ListItem
          leading={<Text>🆔</Text>}
          title="Driver's licence"
          subtitle="Required"
          trailing={<Status ok={!!d.licenseUrl} />}
        />
        <Divider inset={spacing.lg} />
        <ListItem
          leading={<Text>📋</Text>}
          title="Vehicle papers"
          subtitle="Roadworthiness + registration"
          trailing={<Status ok={!!d.vehiclePapersUrl} />}
        />
        <Divider inset={spacing.lg} />
        <ListItem
          leading={<Text>🛡</Text>}
          title="Insurance"
          subtitle="Third-party min."
          trailing={<Status ok={!!d.insuranceUrl} />}
        />
      </Card>

      <Card>
        <Text variant="caption" color="muted">VERIFICATION STATUS</Text>
        <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="small" color="muted">Uploaded</Text>
            <Text variant="small">
              {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="small" color="muted">Verified</Text>
            <Text variant="small">
              {d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
