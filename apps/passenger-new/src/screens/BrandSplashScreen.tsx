import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { isOnboardingComplete } from '../services/onboardingFlag';
import type { AuthStackParamList } from '../navigation/types';

// Minimal yellow brand splash — full-bleed brand colour with the YB logo
// centred. No wordmark, no tagline, no "Passenger" label. Matches the
// pixel-precise reference the user supplied: just the logo on yellow, fade +
// scale-in, then route after ~1.8s. Same screen is used on the driver app.

type Nav = NativeStackNavigationProp<AuthStackParamList, 'BrandSplash'>;

const BRAND_YELLOW = '#FACC15';

export function BrandSplashScreen() {
  const navigation = useNavigation<Nav>();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    // Dismiss the native Expo splash now that this screen has mounted with
    // the same yellow backdrop. Both splashes share #FACC15 + logo, so the
    // cross-over is visually seamless — single perceived brand moment.
    SplashScreen.hideAsync().catch(() => {});

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(async () => {
      const done = await isOnboardingComplete();
      // replace (not reset) — reset from setTimeout can silently drop on RN
      // Navigation v7 + Hermes/Android because the dispatcher reference goes
      // stale across the async hop.
      navigation.replace(done ? 'Login' : 'Onboarding');
    }, 1800);

    return () => clearTimeout(t);
  }, [logoOpacity, logoScale, navigation]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BRAND_YELLOW,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <StatusBar style="dark" backgroundColor={BRAND_YELLOW} />

      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require('../../assets/yb-logo.png')}
          style={{
            // Slightly smaller than before (260→200) so the logo reads as a
            // confident mark, not a wall-filling image. Matches the
            // reference's airy whitespace ratio.
            width: 200,
            height: 200,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
