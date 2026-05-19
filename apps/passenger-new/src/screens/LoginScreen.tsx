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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const { signIn, errorMessage } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      // onAuthStateChanged in AuthContext flips status → signed_in →
      // RootNavigator swaps to the Main stack automatically.
    } catch {
      /* error message lives on AuthContext.errorMessage */
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
            <Text variant="h1">Welcome back</Text>
            <Text variant="body" color="muted">
              Sign in to book a ride with YB Ride.
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
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
          </View>

          <Button
            label={submitting ? 'Signing in…' : 'Sign in'}
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
              New to YB Ride?
            </Text>
            <Text
              variant="smallStrong"
              color="primary"
              onPress={() => navigation.navigate('Signup')}
            >
              Create an account
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
