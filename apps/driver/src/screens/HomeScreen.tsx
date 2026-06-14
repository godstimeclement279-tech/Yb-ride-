import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Map } from '../components/Map';
import { BottomSheet } from '../components/BottomSheet';
import { OnlineToggle } from '../components/OnlineToggle';
import { StatusBadge } from '../components/StatusBadge';
import { Divider } from '../components/Divider';
import { EarningsStat } from '../components/EarningsStat';
import { formatNaira, formatDistance, type Passenger } from '@yb/shared';
import { subscribePassenger } from '../services/firebase/passengersService';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const {
    driverStatus,
    setOnline,
    activeBooking,
    earnings,
    hasIncomingOffer,
    acceptTrip,
    declineTrip,
  } = useTrip();
  const insets = useSafeAreaInsets();

  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const passengerId = activeBooking?.passengerId;
  useEffect(() => {
    if (!passengerId) {
      setPassenger(null);
      return;
    }
    return subscribePassenger(passengerId, setPassenger);
  }, [passengerId]);

  if (!user) return null;

  const isOnline = driverStatus !== 'offline' && driverStatus !== 'suspended';
  const hasActive = !!activeBooking && activeBooking.status !== 'completed' && activeBooking.status !== 'cancelled';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <Map
          style={{ flex: 1 }}
          pickup={activeBooking?.pickup.point}
          dropoff={activeBooking?.dropoff.point}
          showRoute={hasActive}
          bottomPadding={280}
        />

        {/* Top bar: greeting + settings */}
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: spacing.base,
              paddingVertical: spacing.sm,
            }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.pill,
              }}
            >
              <Text variant="bodyStrong" color="primary">
                YB Driver
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              style={{
                backgroundColor: colors.card,
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text>⚙</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <BottomSheet style={{ paddingBottom: insets.bottom + spacing.lg }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 480 }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <View>
              <Text variant="h3">Hi, {user.name.split(' ')[0]}</Text>
              <Text variant="small" color="muted">
                {isOnline ? 'You are accepting trips' : 'Tap to start your shift'}
              </Text>
            </View>
            <OnlineToggle
              online={isOnline}
              onToggle={() => setOnline(!isOnline)}
              disabled={driverStatus === 'on_trip'}
            />
          </View>

          {hasActive && activeBooking && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.card,
                padding: spacing.base,
                gap: spacing.sm,
                marginTop: spacing.md,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyStrong">Active trip</Text>
                <StatusBadge status={activeBooking.status} />
              </View>

              <View>
                <Text variant="caption" color="muted">PASSENGER</Text>
                <Text variant="body">
                  {passenger?.name ?? 'Loading rider…'}
                  {passenger?.averageRating !== undefined
                    ? ` · ★ ${passenger.averageRating.toFixed(1)}`
                    : ''}
                </Text>
              </View>

              <Divider />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.success,
                  }}
                />
                <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
                  {activeBooking.pickup.label}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                  }}
                />
                <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
                  {activeBooking.dropoff.label}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                <Text variant="small" color="muted">
                  {formatDistance(activeBooking.fare.estimatedDistanceKm)} · {activeBooking.fare.carTypeName}
                </Text>
                <Text variant="bodyStrong" color="primary">
                  {formatNaira(activeBooking.fare.total)}
                </Text>
              </View>

              {hasIncomingOffer ? (
                <View style={{ gap: spacing.sm }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <Text variant="caption" color="warning" style={{ fontWeight: '700' }}>
                      ● INCOMING TRIP
                    </Text>
                    <Text variant="caption" color="muted">
                      Respond within 30s
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Decline"
                        onPress={declineTrip}
                        variant="ghost"
                        size="lg"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Accept"
                        onPress={acceptTrip}
                        variant="primary"
                        size="lg"
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <Button
                  label="Open trip"
                  onPress={() => navigation.navigate('ActiveTrip')}
                  size="lg"
                />
              )}
            </View>
          )}

          {!hasActive && (
            <>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                <EarningsStat label="Today" kobo={earnings.todayKobo} tone="success" />
                <EarningsStat label="Trips today" count={earnings.todayTrips} tone="primary" />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <EarningsStat label="This week" kobo={earnings.weekKobo} tone="accent" />
                <EarningsStat label="Week trips" count={earnings.weekTrips} tone="primary" />
              </View>

              <View style={{ marginTop: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
                <Text variant="small" color="muted" style={{ textAlign: 'center' }}>
                  {isOnline
                    ? 'Waiting for trips. Stay close to busy zones to get assigned faster.'
                    : 'Go online to start receiving trips from dispatch.'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
