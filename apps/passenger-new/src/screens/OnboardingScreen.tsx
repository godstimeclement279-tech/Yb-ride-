import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
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

// Premium 3-slide onboarding. Each slide has a hero card (yellow-tinted
// gradient background + AI-generated image floating inside), large h1
// title, body copy, animated pagination dots, and a dark CTA at the
// bottom. Drop AI-generated PNGs at apps/passenger-new/assets/onboarding/
// to replace the logo placeholders — see docs/SETUP_ONBOARDING_IMAGES.md
// for prompts.

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface Slide {
  image: ReturnType<typeof require>;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    image: require('../../assets/onboarding/01-movement.png'),
    title: 'Movement made easy',
    body: 'Book a ride in under 30 seconds. Pickup pre-filled from your GPS. Three taps to confirm.',
  },
  {
    image: require('../../assets/onboarding/02-tracking.png'),
    title: 'See your driver live',
    body: 'Watch your driver approach on the map in real time. Know your ETA to the minute.',
  },
  {
    image: require('../../assets/onboarding/03-paystack.png'),
    title: 'Cashless. Upfront.',
    body: 'See the exact fare before booking. Pay securely by bank transfer through Paystack — no surprises.',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollX.setValue(x);
    const next = Math.round(x / width);
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
      {/* Top bar — small logo wordmark + skip on the right. Lean, no
          background, sits over the slide content. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Image
            source={require('../../assets/yb-logo.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <Text variant="bodyStrong">YB Ride</Text>
        </View>
        <Pressable onPress={skipToLogin} hitSlop={12}>
          <Text variant="smallStrong" color="muted">Skip</Text>
        </Pressable>
      </View>

      {/* Horizontally-paged slides */}
      <Animated.ScrollView
        ref={scrollRef as React.RefObject<ScrollView>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => {
          // Parallax: the image moves slightly slower than the title so the
          // composition reads as having depth as the user swipes.
          const translateImage = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [width * 0.25, 0, -width * 0.25],
            extrapolate: 'clamp',
          });

          return (
            <View
              key={i}
              style={{
                width,
                paddingHorizontal: spacing.lg,
                gap: spacing.xl,
              }}
            >
              {/* Hero card — tinted gradient backdrop, AI image floating
                  inside. Soft, warm, premium feel. */}
              <View
                style={{
                  marginTop: spacing.md,
                  aspectRatio: 1,
                  borderRadius: 32,
                  backgroundColor: colors.primarySoft,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Layered yellow glow behind the image — adds depth without
                    needing a real gradient lib. */}
                <View
                  style={{
                    position: 'absolute',
                    width: '70%',
                    aspectRatio: 1,
                    borderRadius: 999,
                    backgroundColor: colors.primary,
                    opacity: 0.35,
                  }}
                />
                <Animated.Image
                  source={slide.image}
                  style={{
                    width: '78%',
                    height: '78%',
                    transform: [{ translateX: translateImage }],
                  }}
                  resizeMode="contain"
                />
              </View>

              {/* Title + body */}
              <View style={{ gap: spacing.sm, paddingHorizontal: spacing.sm }}>
                <Text variant="h1" style={{ textAlign: 'left' }}>
                  {slide.title}
                </Text>
                <Text
                  variant="body"
                  color="muted"
                  style={{ textAlign: 'left', lineHeight: 24, maxWidth: 360 }}
                >
                  {slide.body}
                </Text>
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Animated pagination dots — active dot stretches to a pill; inactive
          dots stay small and muted. */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          marginBottom: spacing.lg,
        }}
      >
        {SLIDES.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={{
                width: dotWidth,
                height: 8,
                borderRadius: 4,
                opacity: dotOpacity,
                backgroundColor: colors.text,
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
        <Pressable
          onPress={skipToLogin}
          style={{ alignItems: 'center', paddingVertical: spacing.xs }}
        >
          <Text variant="small">
            <Text color="muted">Already have an account? </Text>
            <Text color="text" style={{ fontWeight: '700' }}>Log In</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
