import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { isOnboardingComplete } from '../services/onboardingFlag';
import type { RootStackParamList } from '../navigation/types';

// Driver-side brand intro. Mirrors the passenger BrandSplash exactly so the
// two apps feel like one product family. Minimal yellow background + logo;
// no "Driver" wordmark, no tagline — pixel-precise match to the user's
// reference screenshot.

type Nav = NativeStackNavigationProp<RootStackParamList, 'BrandSplash'>;

const BRAND_YELLOW = '#FACC15';

export function BrandSplashScreen() {
  const navigation = useNavigation<Nav>();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
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
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
