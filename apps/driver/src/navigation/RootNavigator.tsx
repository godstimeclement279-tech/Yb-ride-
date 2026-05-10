import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { MainTabs } from './MainTabs';
import { LoginScreen } from '../screens/LoginScreen';
import { TripDetailsScreen } from '../screens/TripDetailsScreen';
import { ActiveTripScreen } from '../screens/ActiveTripScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { VehicleScreen } from '../screens/VehicleScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { ...theme.typography.h3 },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {!isAuthed ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
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
