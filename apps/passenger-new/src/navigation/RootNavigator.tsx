import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { isOnboardingComplete } from '../services/onboardingFlag';
import { MainTabs } from './MainTabs';
import type { AuthStackParamList, RootStackParamList } from './types';

import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { LocationSearchScreen } from '../screens/LocationSearchScreen';
import { MapPickerScreen } from '../screens/MapPickerScreen';
import { FareBreakdownScreen } from '../screens/FareBreakdownScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { TripTrackingScreen } from '../screens/TripTrackingScreen';
import { RatingScreen } from '../screens/RatingScreen';
import { ReceiptScreen } from '../screens/ReceiptScreen';
import { SavedAddressesScreen } from '../screens/SavedAddressesScreen';
import { AddAddressScreen } from '../screens/AddAddressScreen';
import { PromoCodesScreen } from '../screens/PromoCodesScreen';
import { PaymentMethodsScreen } from '../screens/PaymentMethodsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { HelpCenterScreen } from '../screens/HelpCenterScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const { status } = useAuth();

  // Resolve the onboarding flag once on mount. Until it lands we keep the
  // spinner up — same UX as a still-loading auth session.
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  useEffect(() => {
    isOnboardingComplete().then(setOnboardingDone);
  }, []);

  const navTheme =
    theme.mode === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.text,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.text,
            border: theme.colors.border,
            primary: theme.colors.primary,
          },
        };

  // While the persisted Firebase Auth session AND the onboarding flag are
  // still resolving on first render, show a centered spinner — keeps us
  // from flashing Login to an already-signed-in user, or skipping Onboarding
  // for a first-launch user.
  if (status === 'loading' || onboardingDone === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'signed_in' ? (
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen
            name="LocationSearch"
            component={LocationSearchScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen
            name="MapPicker"
            component={MapPickerScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen name="FareBreakdown" component={FareBreakdownScreen} />
          <RootStack.Screen name="Payment" component={PaymentScreen} />
          <RootStack.Screen name="TripTracking" component={TripTrackingScreen} />
          <RootStack.Screen name="Rating" component={RatingScreen} />
          <RootStack.Screen name="Receipt" component={ReceiptScreen} />
          <RootStack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
          <RootStack.Screen
            name="AddAddress"
            component={AddAddressScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen name="PromoCodes" component={PromoCodesScreen} />
          <RootStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
          <RootStack.Screen name="HelpCenter" component={HelpCenterScreen} />
          <RootStack.Screen name="Privacy" component={PrivacyScreen} />
          <RootStack.Screen name="Legal" component={LegalScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
        </RootStack.Navigator>
      ) : (
        <AuthStack.Navigator
          initialRouteName={onboardingDone ? 'Login' : 'Onboarding'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
