import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import { useAuth } from '../context/AuthContext';
import { isAppleAuthAvailable, signInWithApple } from '../services/appleAuth';
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const { signIn, signInDev, errorMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appleReady, setAppleReady] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  // iOS-only feature gate: hide the Apple button entirely on devices that
  // can't sign in with Apple (Android, older iOS). Apple requires the button
  // ONLY when shown on a supported device — hiding it on Android is fine.
  useEffect(() => {
    isAppleAuthAvailable().then(setAppleReady);
  }, []);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      /* errorMessage already on AuthContext */
    } finally {
      setSubmitting(false);
    }
  };

  const onApplePress = async () => {
    setAppleBusy(true);
    try {
      await signInWithApple();
      // onAuthStateChanged in AuthContext takes over and routes us into the
      // signed-in subtree — no manual navigation needed.
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      // ERR_CANCELED = user dismissed the Apple sheet. Silent no-op.
      if (code === 'ERR_CANCELED' || code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert(
        'Apple sign-in failed',
        (err as { message?: string })?.message ?? 'Please try again.',
      );
    } finally {
      setAppleBusy(false);
    }
  };

  const comingSoon = (provider: string) => {
    Alert.alert(`${provider} sign-in`, 'Coming soon. Use email + password for now.');
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
          {/* Brand logo */}
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Image
              source={require('../../assets/yb-logo.png')}
              style={{
                width: 120,
                height: 120,
                shadowColor: colors.primary,
                shadowOpacity: 0.45,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
              }}
              resizeMode="contain"
            />
          </View>

          {/* Headline */}
          <View style={{ alignItems: 'center', gap: 6, marginBottom: spacing.xl }}>
            <Text variant="h1" style={{ fontSize: 30 }}>
              Welcome Back
            </Text>
            <Text variant="body" color="muted">
              Movement made easy
            </Text>
          </View>

          {errorMessage && (
            <View
              style={{
                backgroundColor: colors.errorSoft,
                padding: spacing.md,
                borderRadius: 12,
                marginBottom: spacing.md,
              }}
            >
              <Text variant="small" color="error">
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={{ gap: spacing.md }}>
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              leadingIcon={<Ionicons name="mail-outline" size={20} color={colors.textMuted} />}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              leadingIcon={
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              }
              trailingIcon={
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              }
              onTrailingPress={() => setShowPassword(v => !v)}
            />
          </View>

          {/* Forgot password */}
          <Pressable
            onPress={() => navigation.navigate('ForgotPassword')}
            style={{ alignSelf: 'flex-end', marginTop: spacing.sm, marginBottom: spacing.lg }}
            hitSlop={10}
          >
            <Text variant="smallStrong">Forgot Password?</Text>
          </Pressable>

          {/* Primary CTA */}
          <Button
            label={submitting ? 'Signing in…' : 'Login'}
            onPress={onSubmit}
            disabled={submitting}
            loading={submitting}
            size="lg"
          />

          {/* OR divider */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginVertical: spacing.lg,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text variant="smallStrong" color="muted">
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* Social row — Apple only shows on iOS where it's actually wired.
              Google is a stub for now; the "Coming soon" alert is acceptable
              under App Store guidelines because it's the same pattern Apple
              uses for unreleased features. */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <SocialButton
              label="Google"
              icon={<Ionicons name="logo-google" size={20} color={colors.text} />}
              onPress={() => comingSoon('Google')}
            />
            {appleReady && (
              <SocialButton
                label={appleBusy ? 'Signing in…' : 'Apple'}
                icon={<Ionicons name="logo-apple" size={20} color={colors.text} />}
                onPress={onApplePress}
              />
            )}
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
              Don't have an account?
            </Text>
            <Text
              variant="smallStrong"
              color="primary"
              onPress={() => navigation.navigate('Signup')}
            >
              Sign Up
            </Text>
          </View>

          {/* Dev-only shortcut. Bypasses Firebase Auth with a mock user so the
              rest of the app is testable when the device's JS fetch path is
              dead (e.g. stuck cellular routes). __DEV__ is false in production
              builds, so this entire block is dead-code-eliminated. */}
          {__DEV__ && (
            <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <Pressable
                onPress={signInDev}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 999,
                  opacity: pressed ? 0.6 : 1,
                })}
                hitSlop={8}
              >
                <Text variant="smallStrong" color="muted">
                  Skip login (dev)
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.surface : colors.background,
      })}
    >
      {icon}
      <Text variant="bodyStrong">{label}</Text>
    </Pressable>
  );
}
