import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { useTheme } from '../theme/ThemeProvider';
import { usePassenger } from '../context/AuthContext';
import { updatePassengerProfile } from '../services/firebase/passengerAuthService';
import { pickAndUploadAvatar } from '../services/avatarUpload';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = usePassenger();
  const { colors, spacing, radius, typography } = useTheme();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Local-only optimistic copy of the avatar URL so the new photo appears
  // immediately after upload. AuthContext's Firestore listener will replace
  // this with the canonical value within a tick.
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | undefined>(
    user.avatarUrl,
  );

  async function onChangePhoto() {
    setUploadingAvatar(true);
    try {
      const result = await pickAndUploadAvatar(user.id);
      if (result.status === 'uploaded' && result.avatarUrl) {
        setLocalAvatarUrl(result.avatarUrl);
      } else if (result.status === 'permission_denied' || result.status === 'failed') {
        Alert.alert('Could not change photo', result.message ?? 'Try again.');
      } else if (result.status === 'not_available') {
        Alert.alert('Photo change unavailable', result.message ?? 'Try later.');
      }
      // 'cancelled' is a silent no-op.
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function onSave() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      await updatePassengerProfile(user.id, {
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail,
      });
      Alert.alert('Saved', 'Profile updated.');
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setSaving(false);
    }
  }

  const fieldBox = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Screen scroll>
      <Header title="Edit Profile" back />

      {/* Tap avatar → expo-image-picker → Firebase Storage upload →
          users/{uid}.avatarUrl write. Optimistic local state shows the
          new photo immediately; the Firestore listener will replace it
          with the canonical value within a tick. */}
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
        <Pressable
          onPress={onChangePhoto}
          disabled={uploadingAvatar || saving}
          hitSlop={10}
          accessibilityLabel="Change profile photo"
          style={({ pressed }) => ({
            opacity: pressed || uploadingAvatar ? 0.7 : 1,
          })}
        >
          <View>
            <Avatar name={name || user.name} size={80} uri={localAvatarUrl} />
            {uploadingAvatar && (
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>
        </Pressable>
        <Text variant="smallStrong" color="primary">
          {uploadingAvatar ? 'Uploading…' : 'Change photo'}
        </Text>
      </View>

      <Card variant="soft">
        <Field
          label="Full Name"
          value={name}
          onChangeText={setName}
          fieldBox={fieldBox}
          colors={colors}
          typography={typography}
        />
        <View style={{ height: spacing.md }} />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          fieldBox={fieldBox}
          colors={colors}
          typography={typography}
        />
        <View style={{ height: spacing.md }} />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          fieldBox={fieldBox}
          colors={colors}
          typography={typography}
        />
      </Card>

      <Button
        label={saving ? 'Saving…' : 'Save'}
        size="lg"
        disabled={saving}
        onPress={onSave}
      />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  fieldBox,
  colors,
  typography,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  fieldBox: any;
  colors: any;
  typography: any;
}) {
  return (
    <View>
      <Text variant="caption" color="muted" style={{ marginBottom: 6 }}>
        {label.toUpperCase()}
      </Text>
      <View style={fieldBox}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor={colors.textMuted}
          style={{ color: colors.text, ...typography.body, padding: 0 }}
        />
      </View>
    </View>
  );
}
