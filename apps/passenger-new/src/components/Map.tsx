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

// Map tiles now come from Google via react-native-maps' Android Google
// Maps provider. Mapbox/OSM had thin Agbor data; Google has full street +
// POI coverage. Driving directions still come from Mapbox Directions
// (separate from tiles) because the cost/quality is fine and switching
// would just add another billed Google API.

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
  // Called when Mapbox Directions returns a route. Lets the parent show ETA
  // (durationSec / 60) or the actual driving distance (distanceM / 1000).
  onRoute?: (result: { distanceM: number; durationSec: number }) => void;
}

// Default deltas chosen so the map opens roughly the equivalent of Mapbox
// zoom 14 (close enough to read street labels at the Agbor neighborhood
// level). Smaller delta = more zoomed in.
const DEFAULT_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

export function Map({
  style,
  pickup,
  dropoff,
  driverLocation,
  showRoute = false,
  bottomPadding = 0,
  onRoute,
}: MapProps) {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  const initialRegion: MapViewProps['initialRegion'] = useMemo(() => {
    const center = pickup ?? driverLocation ?? AGBOR_CENTER;
    return { ...DEFAULT_DELTA, latitude: center.latitude, longitude: center.longitude };
  }, [pickup, driverLocation]);

  // Fit pickup + dropoff into view when both present; otherwise nudge to
  // pickup if it changes.
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
    } else if (pickup) {
      mapRef.current.animateToRegion(
        { ...DEFAULT_DELTA, latitude: pickup.latitude, longitude: pickup.longitude },
        500,
      );
    }
  }, [pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, bottomPadding]);

  // Route polyline + ETA via Mapbox Directions. Falls back to a straight
  // line if the API call fails. Re-fetches when endpoints change.
  const [routeCoords, setRouteCoords] = useState<GeoPoint[] | null>(null);
  useEffect(() => {
    if (!showRoute || !pickup || !dropoff) {
      setRouteCoords(null);
      return;
    }
    let cancelled = false;
    getDrivingDirections(pickup, dropoff).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteCoords(
          result.routeCoordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
        );
        onRoute?.({ distanceM: result.distanceM, durationSec: result.durationSec });
      } else {
        setRouteCoords([
          { latitude: pickup.latitude, longitude: pickup.longitude },
          { latitude: dropoff.latitude, longitude: dropoff.longitude },
        ]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [showRoute, pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, onRoute]);

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
                backgroundColor: colors.pickup,
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
                backgroundColor: colors.dropoff,
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
