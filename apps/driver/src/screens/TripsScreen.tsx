import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Pill } from '../components/Pill';
import { TripCard } from '../components/TripCard';
import { useTrip } from '../context/TripContext';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | 'completed' | 'cancelled';

export function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { spacing } = useTheme();
  const { pastBookings } = useTrip();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return pastBookings;
    return pastBookings.filter(b => b.status === filter);
  }, [pastBookings, filter]);

  return (
    <Screen scroll>
      <Text variant="h2">Trip history</Text>
      <Text variant="small" color="muted">All your past trips</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm }}>
        <Pill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill
          label="Completed"
          tone="success"
          active={filter === 'completed'}
          onPress={() => setFilter('completed')}
        />
        <Pill
          label="Cancelled"
          tone="error"
          active={filter === 'cancelled'}
          onPress={() => setFilter('cancelled')}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <Text variant="body" color="muted">No trips yet</Text>
        </View>
      ) : (
        filtered.map(b => (
          <TripCard
            key={b.id}
            booking={b}
            onPress={() => navigation.navigate('TripDetails', { bookingId: b.id })}
          />
        ))
      )}
    </Screen>
  );
}
