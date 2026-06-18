import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
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

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = usePassenger();
  const { colors, spacing, radius, typography } = useTheme();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

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

      {/* Avatar display only — photo upload is wired in a follow-up PR
          (expo-image-picker + Firebase Storage). Until then we show the
          generated initials avatar without a misleading "Change photo"
          affordance that does nothing. */}
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Avatar name={name || user.name} size={80} />
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
