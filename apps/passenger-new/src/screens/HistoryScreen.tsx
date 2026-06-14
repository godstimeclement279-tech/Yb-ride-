import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { FilterChip } from '../components/FilterChip';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';
import { usePassenger } from '../context/AuthContext';
import { subscribePassengerBookings } from '../services/firebase/bookingsService';
import { formatNaira, type Booking } from '@yb/shared';
import type { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | 'completed' | 'cancelled';

const dayMs = 1000 * 60 * 60 * 24;

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const RIDE_ICON: Record<string, string> = {
  standard: '🚗',
  premium: '🚙',
  suv: '🚐',
};

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, spacing } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const user = usePassenger();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  useEffect(() => subscribePassengerBookings(user.id, setAllBookings), [user.id]);

  const filtered = useMemo(() => {
    const sorted = [...allBookings].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === 'all') return sorted;
    return sorted.filter((b) => b.status === filter);
  }, [allBookings, filter]);

  const groups = useMemo(() => {
    const now = Date.now();
    const recent: Booking[] = [];
    const older: Booking[] = [];
    for (const b of filtered) {
      if (now - b.createdAt < 7 * dayMs) recent.push(b);
      else older.push(b);
    }
    return { recent, older };
  }, [filtered]);

  const totalCompleted = allBookings.filter(b => b.status === 'completed').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.base }}>
        <Header
          title="Trip History"
          subtitle={`${totalCompleted} ${totalCompleted === 1 ? 'trip' : 'trips'} completed`}
          back={false}
          trailing={
            <Text variant="h3" onPress={() => navigation.goBack()}>×</Text>
          }
        />
      </View>

      <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <FilterChip label="All Trips" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Completed" active={filter === 'completed'} onPress={() => setFilter('completed')} />
          <FilterChip label="Cancelled" active={filter === 'cancelled'} onPress={() => setFilter('cancelled')} />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, paddingTop: 0, gap: spacing.base, paddingBottom: spacing.xxl }}
      >
        {groups.recent.length > 0 && (
          <>
            <Text
              variant="overline"
              color="muted"
              style={{ textAlign: 'center', marginVertical: spacing.sm }}
            >
              RECENT
            </Text>
            {groups.recent.map(b => (
              <TripRow
                key={b.id}
                booking={b}
                onPress={() => navigation.navigate('Receipt', { bookingId: b.id })}
              />
            ))}
          </>
        )}

        {groups.older.length > 0 && (
          <>
            <Text
              variant="overline"
              color="muted"
              style={{ textAlign: 'center', marginVertical: spacing.sm }}
            >
              EARLIER
            </Text>
            {groups.older.map(b => (
              <TripRow
                key={b.id}
                booking={b}
                onPress={() => navigation.navigate('Receipt', { bookingId: b.id })}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
            <Text variant="body" color="muted">
              {filter === 'all' ? 'No trips yet' : `No ${filter} trips`}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TripRow({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <Card variant="soft" onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text variant="caption">{fmtDate(booking.createdAt)}</Text>
        </View>
        <Badge
          label={isCompleted ? 'COMPLETED' : isCancelled ? 'CANCELLED' : booking.status.toUpperCase()}
          tone={isCompleted ? 'success' : isCancelled ? 'error' : 'primary'}
        />
        <Text variant="bodyStrong">{formatNaira(booking.fare.total)}</Text>
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: colors.text,
            }}
          />
          <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
            {booking.pickup.label}
          </Text>
        </View>
        <View style={{ marginLeft: 6, height: 14, width: 2, backgroundColor: colors.border }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              backgroundColor: colors.dropoff,
            }}
          />
          <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
            {booking.dropoff.label}
          </Text>
        </View>
      </View>

      <View style={{ marginVertical: spacing.sm }}>
        <Divider />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text>{RIDE_ICON[booking.carTypeId] ?? '🚕'}</Text>
          <Text variant="small" color="muted">
            YB {booking.fare.carTypeName}
          </Text>
        </View>
        <Text variant="smallStrong">View Receipt</Text>
      </View>
    </Card>
  );
}
