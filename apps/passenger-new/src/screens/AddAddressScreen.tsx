import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Pill } from '../components/Pill';
import { Header } from '../components/Header';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useTheme } from '../theme/ThemeProvider';
import { usePassenger } from '../context/AuthContext';
import {
  addSavedAddress,
  deleteSavedAddress,
  updateSavedAddress,
} from '../services/firebase/savedAddressesService';
import { searchPlaces } from '../services/google';
import { AGBOR_CENTER } from '../services/mapbox';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'AddAddress'>;
type AddressType = 'home' | 'work' | 'other';

export function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const editing = route.params?.address;
  const user = usePassenger();

  const { colors, spacing, radius, typography } = useTheme();

  const [type, setType] = useState<AddressType>(editing?.type ?? 'home');
  const [label, setLabel] = useState(editing?.label ?? '');
  const [address, setAddress] = useState(editing?.formatted ?? '');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fieldBox = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  };

  // Forward-geocode the typed address so the saved row has a real GeoPoint
  // for routing. If geocoding fails (no network / no results), fall back to
  // Agbor centre + a warning toast — better than silently saving nothing.
  // Edit mode reuses the existing point unless the address text changed.
  async function resolvePoint() {
    if (editing && address.trim() === editing.formatted.trim()) {
      return { point: editing.point, placeId: editing.placeId };
    }
    const matches = await searchPlaces(address);
    if (matches.length > 0) {
      const first = matches[0]!;
      return { point: first.point, placeId: first.placeId };
    }
    return { point: AGBOR_CENTER, placeId: undefined };
  }

  async function onSave() {
    const trimmedLabel = label.trim();
    const trimmedAddress = address.trim();
    if (!trimmedLabel || !trimmedAddress) return;

    setSaving(true);
    try {
      const { point, placeId } = await resolvePoint();
      const payload = {
        type,
        label: trimmedLabel,
        formatted: trimmedAddress,
        point,
        ...(placeId !== undefined ? { placeId } : {}),
      };
      if (editing) {
        await updateSavedAddress(user.id, editing.id, payload);
      } else {
        await addSavedAddress(user.id, payload);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Could not save',
        (err as { message?: string })?.message ?? 'Try again in a moment.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!editing) return;
    setDeleteOpen(false);
    setDeleting(true);
    try {
      await deleteSavedAddress(user.id, editing.id);
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Could not delete',
        (err as { message?: string })?.message ?? 'Try again in a moment.',
      );
    } finally {
      setDeleting(false);
    }
  }

  const busy = saving || deleting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll>
        <Header title={editing ? 'Edit Address' : 'Add Address'} back />

        <Card variant="soft">
          <Text variant="caption" color="muted" style={{ marginBottom: spacing.sm }}>
            TYPE
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pill label="Home" leading={<Text>🏠</Text>} active={type === 'home'} onPress={() => setType('home')} />
            <Pill label="Work" leading={<Text>💼</Text>} active={type === 'work'} onPress={() => setType('work')} />
            <Pill label="Other" leading={<Text>📍</Text>} active={type === 'other'} onPress={() => setType('other')} />
          </View>
        </Card>

        <Card variant="soft">
          <Text variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
            LABEL
          </Text>
          <View style={fieldBox}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={type === 'home' ? 'Home' : type === 'work' ? 'Work' : 'My place'}
              placeholderTextColor={colors.textMuted}
              style={{ color: colors.text, ...typography.body, padding: 0 }}
              editable={!busy}
            />
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Text variant="caption" color="muted" style={{ marginBottom: spacing.xs }}>
              ADDRESS
            </Text>
            <View style={[fieldBox, { minHeight: 90 }]}>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="123 Old Lagos Rd, Agbor, Delta State"
                placeholderTextColor={colors.textMuted}
                multiline
                style={{
                  color: colors.text,
                  ...typography.body,
                  padding: 0,
                  textAlignVertical: 'top',
                }}
                editable={!busy}
              />
            </View>
            <Text variant="caption" color="muted" style={{ marginTop: spacing.xs }}>
              We'll look up the exact spot on the map when you save.
            </Text>
          </View>
        </Card>

        <Button
          label={
            saving
              ? 'Saving…'
              : editing
                ? 'Save Changes'
                : 'Add Address'
          }
          onPress={onSave}
          size="lg"
          disabled={!label.trim() || !address.trim() || busy}
          loading={saving}
        />
        {editing && (
          <Button
            label={deleting ? 'Deleting…' : 'Delete'}
            variant="danger"
            onPress={() => setDeleteOpen(true)}
            disabled={busy}
            loading={deleting}
          />
        )}
      </Screen>

      <ConfirmDialog
        visible={deleteOpen}
        title={editing ? `Delete "${editing.label}"?` : 'Delete?'}
        message="This removes the saved address from your account. Trips that used it stay in your history."
        confirmLabel="Delete"
        confirmTone="danger"
        cancelLabel="Cancel"
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}
