import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type MapViewProps,
} from 'react-native-maps';
import { useTheme } from '../theme/ThemeProvider';
import { AGBOR_CENTER, getDrivingDirections } from '../services/mapbox';

// Driver-side map mirrors the passenger build:
//   Tiles  - Google Maps (Android SDK) via react-native-maps. Mapbox/OSM
//            had thin Agbor data and the previous `<MapView>` from
//            @rnmapbox/maps NPE'd on old-architecture builds.
//   Routes - Mapbox Directions (still cheaper than Google Directions and the
//            polyline is just lat/lng pairs, no SDK lock-in).

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

const DEFAULT_DELTA = { latitudeDelta: 0.025, longitudeDelta: 0.025 };

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
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  const initialRegion: MapViewProps['initialRegion'] = useMemo(() => {
    const center = driverLocation ?? pickup ?? AGBOR_CENTER;
    return { ...DEFAULT_DELTA, latitude: center.latitude, longitude: center.longitude };
  }, [pickup, driverLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (pickup && dropoff) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: dropoff.latitude, longitude: dropoff.longitude },
        ],
        {
          edgePadding: { top: 80, right: 60, bottom: 80 + bottomPadding, left: 60 },
          animated: true,
        },
      );
    } else if (driverLocation) {
      mapRef.current.animateToRegion(
        {
          ...DEFAULT_DELTA,
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
        },
        500,
      );
    }
  }, [
    pickup?.latitude,
    pickup?.longitude,
    dropoff?.latitude,
    dropoff?.longitude,
    driverLocation?.latitude,
    driverLocation?.longitude,
    bottomPadding,
  ]);

  const start = routeStart ?? pickup;
  const end = routeEnd ?? dropoff;

  const [routeCoords, setRouteCoords] = useState<GeoPoint[] | null>(null);
  useEffect(() => {
    if (!showRoute || !start || !end) {
      setRouteCoords(null);
      return;
    }
    let cancelled = false;
    getDrivingDirections(start, end).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteCoords(
          result.routeCoordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
        );
        onRoute?.({ distanceM: result.distanceM, durationSec: result.durationSec });
      } else {
        setRouteCoords([
          { latitude: start.latitude, longitude: start.longitude },
          { latitude: end.latitude, longitude: end.longitude },
        ]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showRoute, start?.latitude, start?.longitude, end?.latitude, end?.longitude, onRoute]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {routeCoords && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {pickup && (
          <Marker
            identifier="pickup"
            coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
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
          </Marker>
        )}

        {dropoff && (
          <Marker
            identifier="dropoff"
            coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
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
          </Marker>
        )}

        {driverLocation && (
          <Marker
            identifier="driver"
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
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
          </Marker>
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
