import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { withDebugBadge } from '../components/DebugBadge';
import { MainTabs } from './MainTabs';
import { BrandSplashScreen } from '../screens/BrandSplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { TripDetailsScreen } from '../screens/TripDetailsScreen';
import { ActiveTripScreen } from '../screens/ActiveTripScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VehicleScreen } from '../screens/VehicleScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Pre-wrapped diagnostic versions of every auth-stack screen. Red badge
// top-left proves the screen mounted; inline ErrorBoundary catches
// per-screen render errors. Strip withDebugBadge wraps before launch.
const DBrandSplash = withDebugBadge('BrandSplash', BrandSplashScreen);
const DOnboarding = withDebugBadge('Onboarding', OnboardingScreen);
const DLogin = withDebugBadge('Login', LoginScreen);

const LAST_ROUTE_KEY = 'yb-driver:last-route';
function persistLastRoute(name: string): void {
  AsyncStorage.setItem(LAST_ROUTE_KEY, JSON.stringify({ name, ts: Date.now() })).catch(() => {});
}

export function RootNavigator() {
  const theme = useTheme();
  const { isAuthed } = useAuth();

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

  return (
    <NavigationContainer
      theme={navTheme}
      onStateChange={state => {
        const route = state?.routes?.[state.index ?? 0];
        if (route?.name) persistLastRoute(route.name);
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { ...theme.typography.h3 },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!isAuthed ? (
          <>
            <Stack.Screen
              name="BrandSplash"
              component={DBrandSplash}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Onboarding"
              component={DOnboarding}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={DLogin}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TripDetails"
              component={TripDetailsScreen}
              options={{ title: 'Trip details' }}
            />
            <Stack.Screen
              name="ActiveTrip"
              component={ActiveTripScreen}
              options={{ title: 'Active trip', headerBackVisible: false }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="Vehicle"
              component={VehicleScreen}
              options={{ title: 'Vehicle' }}
            />
            <Stack.Screen
              name="Documents"
              component={DocumentsScreen}
              options={{ title: 'Documents' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
