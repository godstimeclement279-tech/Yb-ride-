import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeProvider';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

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

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();

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
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="LocationSearch"
          component={LocationSearchScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="MapPicker"
          component={MapPickerScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="FareBreakdown" component={FareBreakdownScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="TripTracking" component={TripTrackingScreen} />
        <Stack.Screen name="Rating" component={RatingScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
        <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
        <Stack.Screen
          name="AddAddress"
          component={AddAddressScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="PromoCodes" component={PromoCodesScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
