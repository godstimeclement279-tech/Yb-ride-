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
import type { RootStackParamList } from '../navigation/types';

// Driver onboarding — mirrors the passenger design exactly so both apps
// feel like one product family. Different copy + image set tailored to the
// driver flow (trips on demand, earnings transparency, schedule
// flexibility). Drop AI-generated PNGs at apps/driver/assets/onboarding/
// to replace the logo placeholders — see docs/SETUP_ONBOARDING_IMAGES.md.

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Slide {
  image: ReturnType<typeof require>;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    image: require('../../assets/onboarding/01-online.png'),
    title: 'Trips, on tap',
    body: 'Get matched with nearby riders the moment you go online. Accept what fits your day, skip what doesn\'t.',
  },
  {
    image: require('../../assets/onboarding/02-trips.png'),
    title: 'Earnings you can see',
    body: 'Track today, this week, and lifetime earnings. Every fare broken down — base, distance, surcharges.',
  },
  {
    image: require('../../assets/onboarding/03-earnings.png'),
    title: 'You drive the schedule',
    body: 'Go online when you want, offline anytime. No quotas, no surge bullying. Your time, your call.',
  },
];

const BRAND_YELLOW = '#FACC15';
const BRAND_YELLOW_SOFT = '#FEF3C7';

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
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
          <Text variant="bodyStrong">YB Driver</Text>
        </View>
        <Pressable onPress={skipToLogin} hitSlop={12}>
          <Text variant="small" color="muted" style={{ fontWeight: '700' }}>Skip</Text>
        </Pressable>
      </View>

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
          const translateImage = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [width * 0.25, 0, -width * 0.25],
            extrapolate: 'clamp',
          });

          return (
            <View
              key={i}
              style={{ width, paddingHorizontal: spacing.lg, gap: spacing.xl }}
            >
              <View
                style={{
                  marginTop: spacing.md,
                  aspectRatio: 1,
                  borderRadius: 32,
                  backgroundColor: BRAND_YELLOW_SOFT,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    width: '70%',
                    aspectRatio: 1,
                    borderRadius: 999,
                    backgroundColor: BRAND_YELLOW,
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
