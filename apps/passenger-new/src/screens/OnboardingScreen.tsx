import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { useTheme } from '../theme/ThemeProvider';
import { markOnboardingComplete } from '../services/onboardingFlag';
import type { AuthStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🚗',
    title: 'Movement made easy',
    body: 'The fastest way to get where you\'re going with just a few taps.',
  },
  {
    emoji: '📍',
    title: 'Live driver tracking',
    body: 'See exactly where your driver is, watch them approach in real time, and know your ETA to the minute.',
  },
  {
    emoji: '💳',
    title: 'Cashless. Upfront.',
    body: 'Know the fare before you book. Pay securely by bank transfer through Paystack — no surprises.',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const width = Dimensions.get('window').width;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const finish = async () => {
    await markOnboardingComplete();
    navigation.replace('Login');
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      finish();
    }
  };

  const skipToLogin = async () => {
    await markOnboardingComplete();
    navigation.replace('Login');
  };

  const onLastSlide = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top bar — brand mark + skip */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.textInverse, fontWeight: '900', fontSize: 18 }}>
              Y
            </Text>
          </View>
          <Text variant="bodyStrong">YB Ride</Text>
        </View>
        <Pressable onPress={skipToLogin} hitSlop={10}>
          <Text variant="smallStrong" color="muted">
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View
            key={i}
            style={{
              width,
              paddingHorizontal: spacing.xl,
              alignItems: 'center',
              gap: spacing.lg,
            }}
          >
            {/* Hero illustration tile */}
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                marginTop: spacing.xl,
                borderRadius: radius.xl,
                backgroundColor: colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 120 }}>{slide.emoji}</Text>
            </View>

            <View style={{ gap: spacing.sm, alignItems: 'center', paddingHorizontal: spacing.md }}>
              <Text variant="h1" style={{ textAlign: 'center' }}>
                {slide.title}
              </Text>
              <Text
                variant="body"
                color="muted"
                style={{ textAlign: 'center', lineHeight: 22 }}
              >
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.xs,
          marginBottom: spacing.lg,
        }}
      >
        {SLIDES.map((_, i) => {
          const active = i === index;
          return (
            <View
              key={i}
              style={{
                width: active ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: active ? colors.primary : colors.border,
              }}
            />
          );
        })}
      </View>

      {/* Footer CTAs */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <Button
          label={onLastSlide ? 'Get Started' : 'Next'}
          onPress={next}
          size="lg"
          rounded="pill"
        />
        <Pressable onPress={skipToLogin} style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
          <Text variant="small">
            <Text color="muted">Already have an account? </Text>
            <Text color="text" style={{ fontWeight: '700' }}>
              Log In
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
