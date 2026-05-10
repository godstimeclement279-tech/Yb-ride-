import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { HomeScreen } from '../screens/HomeScreen';
import { TripsScreen } from '../screens/TripsScreen';
import { EarningsScreen } from '../screens/EarningsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon = (glyph: string) => ({ color, size }: { color: string; size: number }) =>
  <Text style={{ color, fontSize: size }}>{glyph}</Text>;

export function MainTabs() {
  const { colors, typography } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: typography.caption,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { ...typography.h3, color: colors.text },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon('●'), headerShown: false }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsScreen}
        options={{ tabBarIcon: tabIcon('≡'), title: 'Trip history' }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{ tabBarIcon: tabIcon('₦'), title: 'Earnings' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon('◯'), title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
