import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface MapPlaceholderProps {
  style?: StyleProp<ViewStyle>;
  hasRoute?: boolean;
  pickupLabel?: string;
  dropoffLabel?: string;
  driverDot?: boolean;
}

// Pre-Mapbox stand-in for driver app — same grid + roads, but the centered
// driver dot is the focus; pickup/dropoff pins appear when a trip is active.
export function MapPlaceholder({
  style,
  hasRoute,
  pickupLabel,
  dropoffLabel,
  driverDot = true,
}: MapPlaceholderProps) {
  const { colors, mode, spacing, radius } = useTheme();

  const baseBg = mode === 'dark' ? '#0F172A' : '#E8EEF4';
  const lineColor = mode === 'dark' ? '#1F2937' : '#D5DEE9';
  const accent = colors.primary;

  return (
    <View
      style={[
        {
          backgroundColor: baseBg,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {[0.2, 0.4, 0.6, 0.8].map(y => (
        <View
          key={`h-${y}`}
          style={{
            position: 'absolute',
            top: `${y * 100}%`,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: lineColor,
          }}
        />
      ))}
      {[0.25, 0.5, 0.75].map(x => (
        <View
          key={`v-${x}`}
          style={{
            position: 'absolute',
            left: `${x * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: lineColor,
          }}
        />
      ))}

      <View
        style={{
          position: 'absolute',
          top: '52%',
          left: '8%',
          right: '8%',
          height: 6,
          backgroundColor: mode === 'dark' ? '#1E293B' : '#C9D5E3',
          borderRadius: 3,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '12%',
          left: '38%',
          width: 6,
          bottom: '12%',
          backgroundColor: mode === 'dark' ? '#1E293B' : '#C9D5E3',
          borderRadius: 3,
        }}
      />

      {hasRoute && (
        <View
          style={{
            position: 'absolute',
            top: '40%',
            left: '20%',
            right: '20%',
            height: 4,
            backgroundColor: accent,
            borderRadius: 2,
            transform: [{ rotate: '-12deg' }],
          }}
        />
      )}

      {hasRoute && (
        <>
          <View
            style={{
              position: 'absolute',
              top: '45%',
              left: '20%',
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.success,
              borderWidth: 3,
              borderColor: '#fff',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: '35%',
              right: '18%',
              width: 22,
              height: 22,
              borderRadius: 4,
              backgroundColor: accent,
              borderWidth: 3,
              borderColor: '#fff',
            }}
          />
        </>
      )}

      {driverDot && (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.primary,
            borderWidth: 4,
            borderColor: '#fff',
          }}
        />
      )}

      <View
        style={{
          position: 'absolute',
          top: spacing.base,
          left: spacing.base,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          backgroundColor: colors.card,
          borderRadius: radius.sm,
          opacity: 0.85,
        }}
      >
        <Text variant="caption" color="muted">
          {hasRoute
            ? `${pickupLabel ?? 'Pickup'} → ${dropoffLabel ?? 'Dropoff'}`
            : 'Map preview'}
        </Text>
      </View>
    </View>
  );
}
