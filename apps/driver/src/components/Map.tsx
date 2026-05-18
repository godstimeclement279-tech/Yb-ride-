import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Mapbox, { MapView, Camera, PointAnnotation, ShapeSource, LineLayer } from '@rnmapbox/maps';
import { useTheme } from '../theme/ThemeProvider';
import {
  AGBOR_CENTER,
  MAPBOX_PUBLIC_TOKEN,
  getDrivingDirections,
} from '../services/mapbox';

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
  bottomPadding?: number;
  // Optional override for the route's start point. When the driver app is
  // navigating to pickup we pass driverLocation here so the polyline + ETA
  // reflect driver→pickup rather than pickup→dropoff.
  routeStart?: GeoPoint;
  routeEnd?: GeoPoint;
  onRoute?: (result: { distanceM: number; durationSec: number }) => void;
}

export function Map({
  style,
  pickup,
  dropoff,
  driverLocation,
  showRoute = false,
  bottomPadding = 0,
  routeStart,
  routeEnd,
  onRoute,
}: MapProps) {
  const { colors, mode } = useTheme();
  const cameraRef = useRef<Camera>(null);

  const styleURL = mode === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street;

  const initialCenter = useMemo(() => {
    if (driverLocation) return [driverLocation.longitude, driverLocation.latitude];
    if (pickup) return [pickup.longitude, pickup.latitude];
    return [AGBOR_CENTER.longitude, AGBOR_CENTER.latitude];
  }, [pickup, driverLocation]);

  useEffect(() => {
    if (!cameraRef.current) return;
    if (pickup && dropoff) {
      cameraRef.current.fitBounds(
        [Math.min(pickup.longitude, dropoff.longitude), Math.min(pickup.latitude, dropoff.latitude)],
        [Math.max(pickup.longitude, dropoff.longitude), Math.max(pickup.latitude, dropoff.latitude)],
        [80, 60, 80 + bottomPadding, 60],
        700,
      );
    } else if (driverLocation) {
      cameraRef.current.setCamera({
        centerCoordinate: [driverLocation.longitude, driverLocation.latitude],
        zoomLevel: 15,
        animationDuration: 500,
      });
    }
  }, [pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, driverLocation?.latitude, driverLocation?.longitude, bottomPadding]);

  // Resolve actual driving route endpoints. Defaults to pickup→dropoff
  // unless caller supplies explicit routeStart/routeEnd (e.g. driver→pickup).
  const start = routeStart ?? pickup;
  const end = routeEnd ?? dropoff;

  const [routeCoords, setRouteCoords] = useState<Array<[number, number]> | null>(null);
  useEffect(() => {
    if (!showRoute || !start || !end) {
      setRouteCoords(null);
      return;
    }
    let cancelled = false;
    getDrivingDirections(start, end).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteCoords(result.routeCoordinates);
        onRoute?.({ distanceM: result.distanceM, durationSec: result.durationSec });
      } else {
        setRouteCoords([
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showRoute, start?.latitude, start?.longitude, end?.latitude, end?.longitude, onRoute]);

  const routeGeoJson = useMemo(() => {
    if (!routeCoords) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: routeCoords,
          },
          properties: {},
        },
      ],
    };
  }, [routeCoords]);

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
                backgroundColor: colors.success,
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
                backgroundColor: colors.error,
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
                backgroundColor: colors.primary,
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }}
            />
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
