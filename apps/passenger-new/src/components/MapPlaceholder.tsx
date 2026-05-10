import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface MapPlaceholderProps {
  style?: StyleProp<ViewStyle>;
  hasRoute?: boolean;
  pickupLabel?: string;
  dropoffLabel?: string;
  showAttribution?: boolean;
}

// Pre-Mapbox stand-in. Stylized "map" — gridlines + roads + pins.
// Light/dark aware.
export function MapPlaceholder({
  style,
  hasRoute,
  pickupLabel,
  dropoffLabel,
  showAttribution = true,
}: MapPlaceholderProps) {
  const { colors, mode, spacing, radius } = useTheme();

  const baseBg = mode === 'dark' ? '#0F172A' : '#EAF0F4';
  const lineColor = mode === 'dark' ? '#1F2937' : '#D5DEE9';
  const roadColor = mode === 'dark' ? '#1E293B' : '#C9D5E3';
  const accent = colors.text;

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
      {/* Grid */}
      {[0.15, 0.32, 0.48, 0.65, 0.82].map(y => (
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
      {[0.18, 0.4, 0.62, 0.84].map(x => (
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

      {/* Major roads */}
      <View
        style={{
          position: 'absolute',
          top: '52%',
          left: '6%',
          right: '6%',
          height: 8,
          backgroundColor: roadColor,
          borderRadius: 4,
          transform: [{ rotate: '-3deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: '8%',
          left: '38%',
          width: 8,
          bottom: '8%',
          backgroundColor: roadColor,
          borderRadius: 4,
          transform: [{ rotate: '8deg' }],
        }}
      />

      {/* Route line + pins */}
      {hasRoute && (
        <>
          <View
            style={{
              position: 'absolute',
              top: '38%',
              left: '22%',
              right: '22%',
              height: 4,
              backgroundColor: colors.primary,
              borderRadius: 2,
              transform: [{ rotate: '-12deg' }],
            }}
          />
          {/* Pickup pin */}
          <View
            style={{
              position: 'absolute',
              top: '46%',
              left: '20%',
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.pickup,
              borderWidth: 3,
              borderColor: '#fff',
            }}
          />
          {/* Dropoff pin */}
          <View
            style={{
              position: 'absolute',
              top: '32%',
              right: '20%',
              width: 22,
              height: 22,
              borderRadius: 4,
              backgroundColor: colors.dropoff,
              borderWidth: 3,
              borderColor: '#fff',
            }}
          />
        </>
      )}

      {!hasRoute && (
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: accent,
            borderWidth: 3,
            borderColor: '#fff',
          }}
        />
      )}

      {showAttribution && (
        <View
          style={{
            position: 'absolute',
            bottom: spacing.sm,
            right: spacing.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            backgroundColor: colors.card,
            borderRadius: radius.sm,
            opacity: 0.85,
          }}
        >
          <Text variant="caption" color="muted">
            {hasRoute && pickupLabel && dropoffLabel
              ? `${pickupLabel} → ${dropoffLabel}`
              : 'YB Ride map'}
          </Text>
        </View>
      )}
    </View>
  );
}
