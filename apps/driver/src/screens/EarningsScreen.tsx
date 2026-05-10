import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Pill } from '../components/Pill';
import { Divider } from '../components/Divider';
import { TripCard } from '../components/TripCard';
import { useTrip } from '../context/TripContext';
import { useTheme } from '../theme/ThemeProvider';
import { formatNaira } from '@yb/shared';

type Range = 'today' | 'week' | 'all';

const dayMs = 1000 * 60 * 60 * 24;

export function EarningsScreen() {
  const { spacing, colors } = useTheme();
  const { pastBookings, earnings } = useTrip();
  const [range, setRange] = useState<Range>('today');

  const cutoff = useMemo(() => {
    const now = Date.now();
    if (range === 'today') return now - dayMs;
    if (range === 'week') return now - dayMs * 7;
    return 0;
  }, [range]);

  const trips = useMemo(
    () => pastBookings.filter(b => b.status === 'completed' && b.createdAt >= cutoff),
    [pastBookings, cutoff],
  );

  const total = trips.reduce((sum, b) => sum + b.fare.total, 0);

  const totalsForRange = (() => {
    switch (range) {
      case 'today': return { kobo: earnings.todayKobo, count: earnings.todayTrips };
      case 'week':  return { kobo: earnings.weekKobo,  count: earnings.weekTrips };
      case 'all':   return { kobo: earnings.totalKobo, count: earnings.totalTrips };
    }
  })();

  return (
    <Screen scroll>
      <Text variant="h2">Earnings</Text>
      <Text variant="small" color="muted">All amounts in NGN.</Text>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <Pill label="Today" active={range === 'today'} onPress={() => setRange('today')} />
        <Pill label="This week" active={range === 'week'} onPress={() => setRange('week')} />
        <Pill label="All time" active={range === 'all'} onPress={() => setRange('all')} />
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {range === 'today' ? 'Today' : range === 'week' ? 'This week' : 'All time'}
        </Text>
        <Text variant="h1" style={{ marginTop: spacing.xs }}>
          {formatNaira(totalsForRange.kobo)}
        </Text>
        <Text variant="small" color="muted">
          {totalsForRange.count} {totalsForRange.count === 1 ? 'trip' : 'trips'}
        </Text>
        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
          <Stat label="Avg per trip" value={totalsForRange.count ? formatNaira(Math.round(totalsForRange.kobo / totalsForRange.count)) : '—'} />
          <Stat label="Visible trips" value={String(trips.length)} accent={colors.primary} />
        </View>
      </Card>

      <Text variant="caption" color="muted" style={{ marginTop: spacing.lg, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        Trips in this range
      </Text>

      {trips.length === 0 ? (
        <Text variant="small" color="muted" style={{ marginTop: spacing.sm }}>
          No completed trips in this range.
        </Text>
      ) : (
        trips.map(b => <TripCard key={b.id} booking={b} />)
      )}

      <Card style={{ marginTop: spacing.md }}>
        <Text variant="caption" color="muted">PAYOUT</Text>
        <Text variant="small" style={{ marginTop: spacing.xs }}>
          Earnings settle to your registered bank account weekly. Contact dispatch for
          payout questions.
        </Text>
      </Card>
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View>
      <Text variant="caption" color="muted">{label}</Text>
      <Text variant="bodyStrong" style={accent ? { color: accent } : undefined}>{value}</Text>
    </View>
  );
}
