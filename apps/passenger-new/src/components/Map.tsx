import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Mapbox, { MapView, Camera, PointAnnotation, ShapeSource, LineLayer } from '@rnmapbox/maps';
import { useTheme } from '../theme/ThemeProvider';
import { AGBOR_CENTER, MAPBOX_PUBLIC_TOKEN } from '../services/mapbox';

// Initialize Mapbox once at module load.
Mapbox.setAccessToken(MAPBOX_PUBLIC_TOKEN);

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
  // Padding around fitted bounds. Useful when a bottom sheet covers the map.
  bottomPadding?: number;
}

export function Map({
  style,
  pickup,
  dropoff,
  driverLocation,
  showRoute = false,
  bottomPadding = 0,
}: MapProps) {
  const { colors, mode } = useTheme();
  const cameraRef = useRef<Camera>(null);

  // Pick a style URL — dark in dark mode, streets otherwise.
  const styleURL = mode === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street;

  // Centre on whatever is most relevant: route bounds > driver > pickup > Agbor.
  const initialCenter = useMemo(() => {
    if (pickup) return [pickup.longitude, pickup.latitude];
    if (driverLocation) return [driverLocation.longitude, driverLocation.latitude];
    return [AGBOR_CENTER.longitude, AGBOR_CENTER.latitude];
  }, [pickup, driverLocation]);

  // When pickup AND dropoff present, fit bounds.
  useEffect(() => {
    if (!cameraRef.current) return;
    if (pickup && dropoff) {
      cameraRef.current.fitBounds(
        [Math.min(pickup.longitude, dropoff.longitude), Math.min(pickup.latitude, dropoff.latitude)],
        [Math.max(pickup.longitude, dropoff.longitude), Math.max(pickup.latitude, dropoff.latitude)],
        [80, 60, 80 + bottomPadding, 60],
        700,
      );
    } else if (pickup) {
      cameraRef.current.setCamera({
        centerCoordinate: [pickup.longitude, pickup.latitude],
        zoomLevel: 14,
        animationDuration: 500,
      });
    }
  }, [pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, bottomPadding]);

  const routeGeoJson = useMemo(() => {
    if (!showRoute || !pickup || !dropoff) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [pickup.longitude, pickup.latitude],
              [dropoff.longitude, dropoff.latitude],
            ],
          },
          properties: {},
        },
      ],
    };
  }, [showRoute, pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        styleURL={styleURL}
        logoEnabled={false}
        attributionEnabled
        compassEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={false}
      >
        <Camera
          ref={cameraRef}
          centerCoordinate={initialCenter}
          zoomLevel={13}
          animationMode="easeTo"
          animationDuration={0}
        />

        {routeGeoJson && (
          <ShapeSource id="route" shape={routeGeoJson}>
            <LineLayer
              id="route-line"
              style={{
                lineColor: colors.primary,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )}

        {pickup && (
          <PointAnnotation id="pickup" coordinate={[pickup.longitude, pickup.latitude]}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.pickup,
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }}
            />
          </PointAnnotation>
        )}

        {dropoff && (
          <PointAnnotation id="dropoff" coordinate={[dropoff.longitude, dropoff.latitude]}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: colors.dropoff,
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }}
            />
          </PointAnnotation>
        )}

        {driverLocation && (
          <PointAnnotation
            id="driver"
            coordinate={[driverLocation.longitude, driverLocation.latitude]}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.mapDriverOnTrip,
                borderWidth: 3,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FFFFFF',
                }}
              />
            </View>
          </PointAnnotation>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
});
