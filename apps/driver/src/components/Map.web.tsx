import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { getDrivingDirections } from '../services/mapbox';

// Web platform shim. @rnmapbox/maps is native-only; on web the named
// exports come back undefined and React crashes. Until we wire mapbox-gl
// for web, this stylized placeholder keeps the rest of the driver app
// usable in the browser preview. Directions API still runs so parents
// can show real driving ETA / distance even on web.

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface MapProps {
  style?: StyleProp<ViewStyle>;
  pickup?: GeoPoint;
  dropoff?: GeoPoint;
  driverLocation?: GeoPoint | null;
  showRoute?: boolean;
  bottomPadding?: number;
  routeStart?: GeoPoint;
  routeEnd?: GeoPoint;
  onRoute?: (result: { distanceM: number; durationSec: number }) => void;
}

export function Map({
  style,
  pickup,
  dropoff,
  driverLocation,
  showRoute,
  routeStart,
  routeEnd,
  onRoute,
}: MapProps) {
  const start = routeStart ?? pickup;
  const end = routeEnd ?? dropoff;

  useEffect(() => {
    if (!showRoute || !start || !end || !onRoute) return;
    let cancelled = false;
    getDrivingDirections(start, end).then((result) => {
      if (cancelled || !result) return;
      onRoute({ distanceM: result.distanceM, durationSec: result.durationSec });
    });
    return () => {
      cancelled = true;
    };
  }, [showRoute, start?.latitude, start?.longitude, end?.latitude, end?.longitude, onRoute]);

  const { colors, mode, spacing, radius } = useTheme();

  const baseBg = mode === 'dark' ? '#0F172A' : '#EAF0F4';
  const lineColor = mode === 'dark' ? '#1F2937' : '#D5DEE9';
  const roadColor = mode === 'dark' ? '#1E293B' : '#C9D5E3';

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

      {showRoute && pickup && dropoff && (
        <View
          style={{
            position: 'absolute',
            top: '40%',
            left: '22%',
            right: '22%',
            height: 4,
            backgroundColor: colors.primary,
            borderRadius: 2,
            transform: [{ rotate: '-12deg' }],
          }}
        />
      )}

      {pickup && (
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
            borderColor: '#FFFFFF',
          }}
        />
      )}

      {dropoff && (
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
            borderColor: '#FFFFFF',
          }}
        />
      )}

      {driverLocation && (
        <View
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: colors.mapDriverOnTrip,
            borderWidth: 3,
            borderColor: '#FFFFFF',
          }}
        />
      )}

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
          Map preview · web
        </Text>
      </View>
    </View>
  );
}
