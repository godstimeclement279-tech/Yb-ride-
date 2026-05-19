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

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = usePassenger();
  const { colors, spacing, radius, typography } = useTheme();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);

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

      <View style={{ alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
        <Avatar name={name || user.name} size={80} />
        <Text variant="smallStrong" color="primary">Change photo</Text>
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
        label="Save"
        size="lg"
        onPress={() => {
          Alert.alert('Saved', 'Profile updated.');
          navigation.goBack();
        }}
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
