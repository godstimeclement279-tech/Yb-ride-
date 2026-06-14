import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { Pill } from '../components/Pill';
import { useRide } from '../context/RideContext';
import { subscribeDriver } from '../services/firebase/driversService';
import type { RootStackParamList } from '../navigation/types';
import type { Driver, Rating } from '@yb/shared';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Rating'>;

const QUICK_TAGS = [
  'Friendly',
  'Clean car',
  'Safe driver',
  'On time',
  'Smooth ride',
  'Knew the route',
];

const STAR_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'OK',
  4: 'Great',
  5: 'Excellent',
};

export function RatingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, typography } = useTheme();
  const { getBooking, updateBooking } = useRide();

  const booking = getBooking(route.params.bookingId);

  const [stars, setStars] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const driverId = booking?.driverId;
  React.useEffect(() => {
    if (!driverId) {
      setDriver(null);
      return;
    }
    return subscribeDriver(driverId, setDriver);
  }, [driverId]);

  if (!booking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.base }}>
        <Text variant="body" color="muted">Trip not found.</Text>
        <View style={{ marginTop: spacing.md }}>
          <Button label="Done" onPress={() => navigation.popToTop()} />
        </View>
      </SafeAreaView>
    );
  }

  const toggleTag = (t: string) =>
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

  const goToReceipt = () =>
    navigation.reset({
      index: 1,
      routes: [{ name: 'Main' }, { name: 'Receipt', params: { bookingId: booking.id } }],
    });

  const submit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      const fullComment = [tags.join(' · '), comment.trim()].filter(Boolean).join(' — ');
      const rating: Rating = {
        stars: stars as Rating['stars'],
        comment: fullComment || undefined,
        createdAt: Date.now(),
      };
      await updateBooking(booking.id, { ratingFromPassenger: rating });
      goToReceipt();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.base,
            paddingBottom: insets.bottom + spacing.xxl,
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginTop: spacing.md, gap: spacing.sm }}>
            <Text variant="h2" style={{ textAlign: 'center' }}>How was your trip?</Text>
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              Your feedback helps keep YB Ride safe and reliable.
            </Text>
          </View>

          {/* Driver card */}
          <Card variant="soft">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <Avatar name={driver?.name ?? 'Driver'} size={56} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {driver?.name ?? 'Your driver'}
                </Text>
                <Text variant="small" color="muted" numberOfLines={1}>
                  {driver?.vehicle
                    ? `${driver.vehicle.color} ${driver.vehicle.make} ${driver.vehicle.model} · ${driver.vehicle.plate}`
                    : ''}
                </Text>
              </View>
            </View>
          </Card>

          {/* Stars */}
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {[1, 2, 3, 4, 5].map(n => {
                const filled = n <= stars;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setStars(n as 1 | 2 | 3 | 4 | 5)}
                    hitSlop={6}
                    accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: filled ? colors.accentSoft : colors.surface,
                      borderWidth: 1,
                      borderColor: filled ? colors.accent : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 26, color: filled ? colors.accent : colors.textMuted }}>★</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text variant="caption" color={stars === 0 ? 'muted' : 'success'} style={{ minHeight: 18 }}>
              {stars === 0 ? 'Tap a star to rate' : STAR_LABELS[stars]}
            </Text>
          </View>

          {/* Quick tags — only show after at least 1 star tapped */}
          {stars > 0 && (
            <View style={{ gap: spacing.sm }}>
              <Text variant="overline" color="muted">WHAT WENT WELL</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {QUICK_TAGS.map(t => (
                  <Pill key={t} label={t} active={tags.includes(t)} onPress={() => toggleTag(t)} />
                ))}
              </View>
            </View>
          )}

          {/* Comment */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="overline" color="muted">ADD A COMMENT (OPTIONAL)</Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.base,
                minHeight: 100,
              }}
            >
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us more about your trip…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={280}
                style={{
                  color: colors.text,
                  ...typography.body,
                  padding: 0,
                  textAlignVertical: 'top',
                }}
              />
            </View>
            <Text variant="caption" color="subtle" style={{ textAlign: 'right' }}>
              {comment.length}/280
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button
              label={submitting ? 'Submitting…' : 'Submit Rating'}
              size="lg"
              onPress={submit}
              disabled={stars === 0 || submitting}
              loading={submitting}
            />
            <Button label="Skip for now" variant="ghost" onPress={goToReceipt} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
