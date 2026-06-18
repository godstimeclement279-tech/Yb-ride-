import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { IconTile } from '../components/IconTile';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getApp } from '../services/firebase/index';

export function PrivacyScreen() {
  const { spacing } = useTheme();
  const { signOut } = useAuth();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Invoke the deleteAccount Cloud Function (v2 onCall, region europe-west1).
  // The function deletes the Firebase Auth user + Firestore /users/{uid} +
  // cascades bookings. On success we sign out so the local app state matches
  // server state. Required for App Store guideline 5.1.1(v) compliance.
  const doDelete = async () => {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      const app = getApp();
      if (!app) {
        Alert.alert('Cannot delete', 'Firebase is not configured.');
        return;
      }
      const fns = getFunctions(app, 'europe-west1');
      const fn = httpsCallable(fns, 'deleteAccount');
      await fn({});
      // Server is done; clear local auth + nav back to login. Catch any
      // sign-out error because the auth user no longer exists.
      await signOut().catch(() => {});
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ??
        'Try again in a moment, or contact support.';
      Alert.alert('Could not delete account', msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen scroll>
      <Header title="Privacy & Security" back />

      <Card variant="soft" padded={false}>
        <Section title="Account">
          <ListItem
            leading={<IconTile size={44} variant="soft"><Text>🔑</Text></IconTile>}
            title="Change password"
            subtitle="Update your account password"
            showChevron
            onPress={() => Alert.alert('Coming soon')}
            style={{ paddingHorizontal: spacing.base }}
          />
          <Divider inset={spacing.base + 44 + spacing.md} />
          <ListItem
            leading={<IconTile size={44} variant="soft"><Text>📱</Text></IconTile>}
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
            leading={<IconTile size={44} variant="soft"><Text>📥</Text></IconTile>}
            title="Download my data"
            subtitle="Receive a copy of your trips and account"
            showChevron
            onPress={() => Alert.alert('Coming soon')}
            style={{ paddingHorizontal: spacing.base }}
          />
          <Divider inset={spacing.base + 44 + spacing.md} />
          <ListItem
            leading={<IconTile size={44} variant="soft"><Text>🗑</Text></IconTile>}
            title={deleting ? 'Deleting…' : 'Delete account'}
            subtitle="Permanently remove your account and data"
            showChevron
            onPress={() => !deleting && setConfirmOpen(true)}
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

      <ConfirmDialog
        visible={confirmOpen}
        title="Delete your account?"
        message="This permanently removes your profile, trip history, and saved payment methods. You will not be able to recover them."
        confirmLabel="Delete account"
        confirmTone="danger"
        cancelLabel="Cancel"
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />
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
