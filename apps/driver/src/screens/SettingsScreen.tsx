import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Divider } from '../components/Divider';
import { Pill } from '../components/Pill';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { getApp } from '../services/firebase/index';

export function SettingsScreen() {
  const { mode, setMode, spacing } = useTheme();
  const { signOut } = useAuth();

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doSignOut = () => {
    setSignOutOpen(false);
    signOut().catch(() => setSignOutError(true));
  };

  // Invoke deleteMyAccount Cloud Function (v2 onCall, europe-west1).
  // The self-service companion to deleteAccount — the latter is admin-only
  // and rejects non-admin callers. deleteMyAccount derives role+uid from
  // req.auth so no client args are needed. Wipes /drivers/{uid} +
  // /users/{uid} + Auth record. Required for App Store 5.1.1(v).
  const doDelete = async () => {
    setDeleteOpen(false);
    setDeleting(true);
    try {
      const app = getApp();
      if (!app) {
        Alert.alert('Cannot delete', 'Firebase is not configured.');
        return;
      }
      const fns = getFunctions(app, 'europe-west1');
      const fn = httpsCallable(fns, 'deleteMyAccount');
      await fn({});
      await signOut().catch(() => {});
    } catch (err) {
      const msg =
        (err as { message?: string })?.message ??
        'Try again in a moment, or contact YB Ride dispatch.';
      Alert.alert('Could not delete account', msg);
    } finally {
      setDeleting(false);
    }
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

      <Card padded={false}>
        <ListItem
          title={deleting ? 'Deleting…' : 'Delete account'}
          subtitle="Permanently remove your driver profile and trip history"
          onPress={() => !deleting && setDeleteOpen(true)}
        />
      </Card>

      <Button label="Sign out" variant="danger" onPress={() => setSignOutOpen(true)} />

      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text variant="caption" color="muted">YB Ride Driver · v0.1.0</Text>
      </View>

      <ConfirmDialog
        visible={signOutOpen}
        title="Sign out?"
        message="You will go offline and need to sign in again."
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

      <ConfirmDialog
        visible={deleteOpen}
        title="Delete your account?"
        message="This permanently removes your driver profile, trip history, and earnings record. You will need to be re-onboarded by dispatch to drive again."
        confirmLabel="Delete account"
        confirmTone="danger"
        cancelLabel="Cancel"
        onConfirm={doDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Screen>
  );
}
