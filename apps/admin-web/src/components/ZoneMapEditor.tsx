import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import type { GeoPoint } from '@yb/shared';
import { MAPBOX_TOKEN } from '../services/firebase/config';
import { useTheme } from '../theme/ThemeProvider';

// Agbor centre — same coords used everywhere else in the project.
const AGBOR_CENTER: [number, number] = [6.198, 6.215];

interface ZoneMapEditorProps {
  // Existing polygon (ordered ring of GeoPoints). Empty array starts blank.
  polygon: GeoPoint[];
  // Called whenever the user finishes editing the polygon.
  onChange: (polygon: GeoPoint[]) => void;
  height?: number;
}

interface DrawFeature {
  id?: string;
  geometry?: {
    type?: string;
    coordinates?: number[][][];
  };
}

interface DrawEventCollection {
  features?: DrawFeature[];
}

/**
 * Interactive zone polygon editor.
 *
 * Renders a Mapbox map with a polygon-drawing control. User draws / edits
 * a closed polygon; on every change the GeoJSON ring is converted into the
 * shape stored in Firestore (ordered list of `{ latitude, longitude }`).
 *
 * Falls back to a "Mapbox token missing" banner when MAPBOX_TOKEN is empty,
 * so admins don't see a blank map and wonder what's wrong.
 */
export function ZoneMapEditor({ polygon, onChange, height = 340 }: ZoneMapEditorProps) {
  const { mode, palette } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  // Hold the latest onChange so the map's event listener never points at a
  // stale reference. Mapbox listeners don't re-bind when React re-renders.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:
        mode === 'dark'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/streets-v12',
      center: AGBOR_CENTER,
      zoom: 13,
      attributionControl: true,
    });
    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: polygon.length >= 3 ? 'simple_select' : 'draw_polygon',
    });
    // Cast through unknown — mapbox-gl-draw's IControl typing is looser than
    // mapbox-gl expects but it implements the interface correctly at runtime.
    map.addControl(draw as unknown as mapboxgl.IControl, 'top-left');
    drawRef.current = draw;

    map.on('load', () => {
      if (polygon.length >= 3) {
        // Convert GeoPoint ring into a closed GeoJSON polygon (last == first).
        const ring = polygon.map((p) => [p.longitude, p.latitude]);
        ring.push(ring[0]!);
        draw.add({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [ring] },
        });
        // Fit bounds to the polygon.
        const bounds = ring.reduce(
          (b, c) => b.extend(c as [number, number]),
          new mapboxgl.LngLatBounds(
            ring[0] as [number, number],
            ring[0] as [number, number],
          ),
        );
        map.fitBounds(bounds, { padding: 40, animate: false });
      }
    });

    const handleChange = (e: DrawEventCollection) => {
      const features = e.features ?? [];
      const f = features[0];
      const coords = f?.geometry?.coordinates?.[0];
      if (!coords || coords.length < 4) {
        onChangeRef.current([]);
        return;
      }
      // Drop the closing duplicate that mapbox-draw appends.
      const ring = coords.slice(0, -1).map((c) => ({
        longitude: c[0]!,
        latitude: c[1]!,
      }));
      onChangeRef.current(ring);
    };

    map.on('draw.create', handleChange);
    map.on('draw.update', handleChange);
    map.on('draw.delete', () => onChangeRef.current([]));

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // Intentionally omit `polygon` + `mode` — we seed once on mount; further
    // edits flow through Mapbox events, not React state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{
          height,
          borderRadius: 12,
          border: `1px solid ${palette.border}`,
          background: palette.surface,
          color: palette.textMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          textAlign: 'center',
          fontSize: 13,
        }}
      >
        Mapbox token missing. Set VITE_MAPBOX_TOKEN in your .env.local to
        enable the polygon editor.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${palette.border}`,
      }}
    />
  );
}
