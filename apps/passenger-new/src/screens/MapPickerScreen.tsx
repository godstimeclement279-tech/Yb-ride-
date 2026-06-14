import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { useRide } from '../context/RideContext';
import { AGBOR_CENTER } from '../services/mapbox';
import { reverseGeocode } from '../services/google';
import type { LocationSearchMode, RootStackParamList } from '../navigation/types';

// Picker pattern with react-native-maps:
//   - initialRegion (NOT controlled `region`) seeds the map once.
//   - onRegionChangeComplete fires once the drag/zoom settles → we read the
//     final centre and reverse-geocode it (debounced).
// The previous Mapbox version passed `centerCoordinate` to a controlled
// `<Camera>` *and* updated it from `onCameraChanged`, which created a tight
// feedback loop and made the map shake/jitter while dragging. The
// uncontrolled-region approach below eliminates that — the user drags, the
// pin (a fixed overlay) stays centred, the map flows smoothly under it.

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MapPicker'>;

const DEFAULT_DELTA = { latitudeDelta: 0.015, longitudeDelta: 0.015 };

export function MapPickerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const { setPickup, setDropoff, pickup, dropoff } = useRide();

  const mode_: LocationSearchMode = route.params?.mode ?? 'dropoff';
  const seed = mode_ === 'pickup' ? pickup?.point : dropoff?.point;

  const [center, setCenter] = useState<{ longitude: number; latitude: number }>(
    seed ?? AGBOR_CENTER,
  );
  const [previewLabel, setPreviewLabel] = useState<string>('Drag to choose a spot');
  const [resolving, setResolving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const labelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reverse-geocode the centre whenever it changes (debounced so dragging
  // doesn't hammer Google).
  useEffect(() => {
    if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    setResolving(true);
    labelTimeoutRef.current = setTimeout(async () => {
      const r = await reverseGeocode(center.longitude, center.latitude);
      setPreviewLabel(r.label);
      setResolving(false);
    }, 350);
    return () => {
      if (labelTimeoutRef.current) clearTimeout(labelTimeoutRef.current);
    };
  }, [center.latitude, center.longitude]);

  const onRegionChangeComplete = useCallback((region: Region) => {
    setCenter({ latitude: region.latitude, longitude: region.longitude });
  }, []);

  const onConfirm = async () => {
    setConfirming(true);
    try {
      const r = await reverseGeocode(center.longitude, center.latitude);
      const address = {
        label: r.label,
        formatted: r.formatted,
        point: { latitude: center.latitude, longitude: center.longitude },
      };
      if (mode_ === 'pickup') setPickup(address);
      else setDropoff(address);
      navigation.goBack();
    } finally {
      setConfirming(false);
    }
  };

  const initialRegion: Region = {
    ...DEFAULT_DELTA,
    latitude: (seed ?? AGBOR_CENTER).latitude,
    longitude: (seed ?? AGBOR_CENTER).longitude,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      />

      {/* Center pin (floats above the map, doesn't move with the map). */}
      <View pointerEvents="none" style={styles.pinContainer}>
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: mode_ === 'pickup' ? colors.pickup : colors.dropoff,
            borderWidth: 4,
            borderColor: '#FFFFFF',
          }}
        />
        {/* shadow below pin */}
        <View
          style={{
            width: 8,
            height: 4,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.25)',
            marginTop: 4,
          }}
        />
      </View>

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.base,
            paddingTop: spacing.sm,
          }}
        >
          <IconButton glyph="‹" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text variant="caption" color="muted">
              {mode_ === 'pickup' ? 'Set pickup location' : 'Set destination'}
            </Text>
            <Text variant="bodyStrong" numberOfLines={1}>
              {resolving ? 'Locating…' : previewLabel}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom confirm panel */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.base,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          gap: spacing.sm,
        }}
      >
        <Text variant="caption" color="muted">Coordinates</Text>
        <Text variant="small">
          {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </Text>
        <Button
          label={confirming ? 'Confirming…' : `Confirm ${mode_ === 'pickup' ? 'Pickup' : 'Destination'}`}
          size="lg"
          onPress={onConfirm}
          disabled={confirming}
          loading={confirming}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -28, // half pin + shadow offset
    alignItems: 'center',
  },
});
