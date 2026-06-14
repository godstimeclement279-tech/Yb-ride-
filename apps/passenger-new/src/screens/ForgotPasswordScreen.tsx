import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { useTheme } from '../theme/ThemeProvider';
import {
  mapAuthError,
  sendPasswordReset,
} from '../services/firebase/passengerAuthService';
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const BRAND_YELLOW = '#FACC15';
const INK = '#0A0A0A';

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Enter the email tied to your account.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      setError(mapAuthError(code));
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
            paddingTop: spacing.xl,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 22,
                backgroundColor: BRAND_YELLOW,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="lock-closed" size={40} color={INK} />
            </View>
          </View>

          {/* Headline */}
          <View style={{ alignItems: 'center', gap: 8, marginBottom: spacing.xl }}>
            <Text variant="h1" style={{ fontSize: 28 }}>
              Forgot Password?
            </Text>
            <Text
              variant="body"
              color="muted"
              style={{ textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.md }}
            >
              Enter the email tied to your account. We'll send you a link to set a new password.
            </Text>
          </View>

          {sent ? (
            <View
              style={{
                backgroundColor: colors.successSoft,
                padding: spacing.md,
                borderRadius: 12,
                gap: spacing.xs,
              }}
            >
              <Text variant="bodyStrong" color="success">
                Email sent
              </Text>
              <Text variant="small" color="muted" style={{ lineHeight: 20 }}>
                Check your inbox for a reset link. Didn't get it? Look in spam, or tap below to
                resend.
              </Text>
            </View>
          ) : null}

          {error && !sent && (
            <View
              style={{
                backgroundColor: colors.errorSoft,
                padding: spacing.md,
                borderRadius: 12,
                marginBottom: spacing.md,
              }}
            >
              <Text variant="small" color="error">
                {error}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={{ gap: spacing.md, marginTop: sent ? spacing.lg : 0 }}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              leadingIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Button
              label={
                submitting
                  ? 'Sending…'
                  : sent
                  ? 'Resend Reset Link'
                  : 'Send Reset Link'
              }
              onPress={onSubmit}
              disabled={submitting}
              loading={submitting}
              size="lg"
            />
          </View>

          {/* Footer link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing.xs,
              marginTop: spacing.xl,
            }}
          >
            <Text variant="small" color="muted">
              Remember your password?
            </Text>
            <Text
              variant="smallStrong"
              color="primary"
              onPress={() => navigation.navigate('Login')}
            >
              Log In
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
