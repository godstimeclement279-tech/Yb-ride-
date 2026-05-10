import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth, DEMO_LOGIN } from '../context/AuthContext';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { Card } from '../components/Card';

export function LoginScreen() {
  const { colors, spacing } = useTheme();
  const { signIn, loading, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    await signIn(phone, password);
  };

  const fillDemo = () => {
    setPhone(DEMO_LOGIN.phone);
    setPassword(DEMO_LOGIN.password);
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
            <Text variant="small" color="muted">
              Sign in with the credentials your admin gave you.
            </Text>
          </View>

          <Card>
            <View style={{ gap: spacing.md }}>
              <TextInput
                label="Phone number"
                placeholder="+234 801 234 5678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {error && (
                <Text variant="small" color="error">{error}</Text>
              )}
              <Button label="Sign in" onPress={onSubmit} loading={loading} size="lg" />
              <Button label="Use demo credentials" onPress={fillDemo} variant="ghost" />
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
