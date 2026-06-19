import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { Card } from '../components/Card';

export function LoginScreen() {
  const { colors, spacing } = useTheme();
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    await signIn(email, password);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.base, gap: spacing.lg, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginTop: spacing.xxxl, gap: spacing.sm }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.textInverse, fontSize: 30, fontWeight: '700' }}>YB</Text>
            </View>
            <Text variant="h1" style={{ marginTop: spacing.sm }}>YB Ride Driver</Text>
            <Text variant="small" color="muted" style={{ textAlign: 'center' }}>
              Sign in with the email + password an admin set up for you.
            </Text>
          </View>

          <Card>
            <View style={{ gap: spacing.md }}>
              <TextInput
                label="Email"
                placeholder="you@ybride.ng"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
              <TextInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                autoComplete="password"
              />
              {error && (
                <Text variant="small" color="error">{error}</Text>
              )}
              <Button
                label="Sign in"
                onPress={onSubmit}
                loading={loading}
                disabled={loading || !email || !password}
                size="lg"
              />
            </View>
          </Card>

          <View style={{ marginTop: 'auto', alignItems: 'center', gap: spacing.xs }}>
            <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
              No account? Drivers are onboarded by YB Ride admin only.
            </Text>
            <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
              Contact dispatch to request access.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
