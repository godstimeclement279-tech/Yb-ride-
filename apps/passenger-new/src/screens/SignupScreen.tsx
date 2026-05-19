import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const { signUp, errorMessage } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Fill every field to create your account.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ email, password, name, phone });
    } catch {
      /* error already in AuthContext.errorMessage */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.lg,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginTop: spacing.xl, gap: spacing.xs }}>
            <Text variant="h1">Create account</Text>
            <Text variant="body" color="muted">
              Sign up to book your first ride.
            </Text>
          </View>

          {errorMessage && (
            <View
              style={{
                backgroundColor: colors.errorSoft,
                padding: spacing.md,
                borderRadius: 12,
              }}
            >
              <Text variant="small" color="error">
                {errorMessage}
              </Text>
            </View>
          )}

          <View style={{ gap: spacing.md }}>
            <TextInput
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Chinedu Okafor"
              autoCapitalize="words"
              textContentType="name"
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+2348012345678"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
            />
          </View>

          <Button
            label={submitting ? 'Creating account…' : 'Create account'}
            onPress={onSubmit}
            disabled={submitting}
            loading={submitting}
            size="lg"
          />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing.xs,
              marginTop: spacing.md,
            }}
          >
            <Text variant="small" color="muted">
              Already have an account?
            </Text>
            <Text
              variant="smallStrong"
              color="primary"
              onPress={() => navigation.navigate('Login')}
            >
              Sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
