import React, { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Text } from '../components/Text';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Pill } from '../components/Pill';
import { IconTile } from '../components/IconTile';
import { Divider } from '../components/Divider';
import { useTheme } from '../theme/ThemeProvider';
import { MOCK_NOTIFICATIONS, type MockNotification } from '../data/mockData';

const CATEGORY_ICON: Record<MockNotification['category'], string> = {
  trip: '🚗',
  promo: '🏷',
  account: '👤',
};

function timeAgo(ts: number, now = Date.now()): string {
  const sec = Math.round((now - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

type Filter = 'all' | MockNotification['category'];

export function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered =
    filter === 'all' ? MOCK_NOTIFICATIONS : MOCK_NOTIFICATIONS.filter(n => n.category === filter);

  return (
    <Screen scroll>
      <Header title="Notifications" back />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pill label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill label="Trips" active={filter === 'trip'} onPress={() => setFilter('trip')} />
        <Pill label="Promos" active={filter === 'promo'} onPress={() => setFilter('promo')} />
        <Pill label="Account" active={filter === 'account'} onPress={() => setFilter('account')} />
      </View>

      {filtered.length === 0 ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
          <Text variant="body" color="muted">No notifications</Text>
        </View>
      ) : (
        <Card variant="soft" padded={false}>
          {filtered.map((n, i) => (
            <React.Fragment key={n.id}>
              <View
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  padding: spacing.base,
                  alignItems: 'flex-start',
                  opacity: n.read ? 0.7 : 1,
                }}
              >
                <IconTile size={44} variant="card">
                  <Text>{CATEGORY_ICON[n.category]}</Text>
                </IconTile>
                <View style={{ flex: 1, gap: 2 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="bodyStrong">{n.title}</Text>
                    <Text variant="caption" color="muted">{timeAgo(n.createdAt)}</Text>
                  </View>
                  <Text variant="small" color="muted">{n.body}</Text>
                </View>
                {!n.read && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary,
                      marginTop: 6,
                    }}
                  />
                )}
              </View>
              {i < filtered.length - 1 && <Divider inset={spacing.base + 44 + spacing.md} />}
            </React.Fragment>
          ))}
        </Card>
      )}
    </Screen>
  );
}
