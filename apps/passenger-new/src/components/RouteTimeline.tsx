import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface RouteStop {
  label: string;
  detail?: string;
  timestamp?: string;
  type: 'pickup' | 'dropoff' | 'stop';
}

interface RouteTimelineProps {
  stops: RouteStop[];
  compact?: boolean;
}

// Vertical pickup→dropoff timeline used on receipt, fare-breakdown, and
// location-search screens. Pickup = solid green dot. Dropoff = pink/rose
// outlined square. Connecting line between them.
export function RouteTimeline({ stops, compact }: RouteTimelineProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ gap: compact ? spacing.sm : spacing.base }}>
      {stops.map((stop, i) => {
        const isPickup = stop.type === 'pickup';
        const isDropoff = stop.type === 'dropoff';

        return (
          <View key={`${stop.type}-${i}`} style={{ flexDirection: 'row', gap: spacing.md }}>
            {/* Indicator + connector */}
            <View style={{ width: 14, alignItems: 'center' }}>
              {isPickup ? (
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: colors.text,
                    backgroundColor: colors.background,
                  }}
                />
              ) : isDropoff ? (
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    backgroundColor: colors.dropoff,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.textMuted,
                  }}
                />
              )}
              {i < stops.length - 1 && (
                <View
                  style={{
                    flex: 1,
                    width: 2,
                    minHeight: 24,
                    backgroundColor: colors.border,
                    marginVertical: 4,
                  }}
                />
              )}
            </View>

            {/* Content */}
            <View style={{ flex: 1, paddingBottom: i < stops.length - 1 ? spacing.sm : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" color="muted">
                  {isPickup ? 'PICKUP' : isDropoff ? 'DESTINATION' : 'STOP'}
                </Text>
                {stop.timestamp && (
                  <Text variant="caption" color="muted">
                    {stop.timestamp}
                  </Text>
                )}
              </View>
              <Text variant="bodyStrong" numberOfLines={2}>
                {stop.label}
              </Text>
              {stop.detail && (
                <Text variant="small" color="muted" numberOfLines={2}>
                  {stop.detail}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
