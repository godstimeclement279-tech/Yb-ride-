import React, { useState } from 'react';
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
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export function SignupScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const { signUp, errorMessage } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
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
    if (!agreed) {
      Alert.alert('Terms required', 'You must accept the Terms of Service and Privacy Policy.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ email, password, name, phone });
    } catch {
      /* errorMessage on AuthContext */
    } finally {
      setSubmitting(false);
    }
  };

  const comingSoon = (provider: string) => {
    Alert.alert(`${provider} sign-up`, 'Coming soon. Use email + password for now.');
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
            paddingTop: spacing.lg,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand mark — small, top-left */}
          <Image
            source={require('../../assets/yb-logo.png')}
            style={{ width: 64, height: 64, marginBottom: spacing.lg }}
            resizeMode="contain"
          />


          {/* Headline */}
          <View style={{ gap: 6, marginBottom: spacing.xl }}>
            <Text variant="h1" style={{ fontSize: 30 }}>
              Create Account
            </Text>
            <Text variant="body" color="muted">
              Join YB Ride — <Text variant="bodyStrong">Movement Made Easy</Text>
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

          <View style={{ gap: spacing.md }}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              textContentType="name"
              autoComplete="name"
              leadingIcon={
                <Ionicons name="person-outline" size={20} color={colors.textMuted} />
              }
            />
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              leadingIcon={
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              }
            />
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+234 800 000 0000"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              leadingIcon={
                <Ionicons name="phone-portrait-outline" size={20} color={colors.textMuted} />
              }
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="password-new"
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

          {/* Terms checkbox */}
          <Pressable
            onPress={() => setAgreed(v => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
              marginTop: spacing.lg,
            }}
            hitSlop={10}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: agreed ? colors.primary : colors.background,
                borderWidth: agreed ? 0 : 1.5,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {agreed && <Ionicons name="checkmark" size={14} color={colors.cta} />}
            </View>
            <Text variant="small" color="muted" style={{ flex: 1, lineHeight: 20 }}>
              By signing up, you agree to our{' '}
              <Text variant="smallStrong">Terms of Service</Text> and{' '}
              <Text variant="smallStrong">Privacy Policy</Text>.
            </Text>
          </Pressable>

          {/* Primary CTA */}
          <View style={{ marginTop: spacing.lg }}>
            <Button
              label={submitting ? 'Creating account…' : 'Create Account'}
              onPress={onSubmit}
              disabled={submitting}
              loading={submitting}
              size="lg"
            />
          </View>

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

          {/* Social row */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <SocialButton
              label="Google"
              icon={<Ionicons name="logo-google" size={20} color={colors.text} />}
              onPress={() => comingSoon('Google')}
              radius={radius.pill}
            />
            <SocialButton
              label="Apple"
              icon={<Ionicons name="logo-apple" size={20} color={colors.text} />}
              onPress={() => comingSoon('Apple')}
              radius={radius.pill}
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
              Already have an account?
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

function SocialButton({
  label,
  icon,
  onPress,
  radius,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  radius: number;
}) {
  const { colors, spacing } = useTheme();
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
        borderRadius: radius,
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
