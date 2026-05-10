import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  Banner,
  Card,
  EmptyState,
  KpiCard,
  PageHeader,
  Pill,
  SectionTitle,
} from '../components/ui';
import { DriverStatusPill } from '../components/status';
import { useAllDrivers, useFleetLocations } from '../hooks/useLiveData';
import { useTheme } from '../theme/ThemeProvider';
import { MAPBOX_TOKEN } from '../services/firebase/config';
import { formatRelative } from '../utils/format';
import type { Driver, DriverLocationDoc, DriverStatus } from '@yb/shared';

// Agbor centre — same coords used by mock data and consistent across the apps.
const AGBOR_CENTER: [number, number] = [6.198, 6.215]; // [lng, lat]

interface Marker {
  id: string;
  driver: Driver;
  loc: DriverLocationDoc;
}

export function Fleet() {
  const drivers = useAllDrivers();
  const locations = useFleetLocations();
  const { mode, palette } = useTheme();

  const driverById = useMemo(() => {
    const map: Record<string, Driver> = {};
    drivers.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [drivers]);

  const markers: Marker[] = useMemo(() => {
    return Object.values(locations)
      .map((loc) => {
        const driver = driverById[loc.driverId];
        if (!driver) return null;
        return { id: loc.driverId, driver, loc } as Marker;
      })
      .filter((m): m is Marker => m !== null);
  }, [locations, driverById]);

  const summary = useMemo(() => {
    const counts: Record<DriverStatus, number> = {
      online: 0,
      on_trip: 0,
      offline: 0,
      suspended: 0,
    };
    markers.forEach((m) => {
      counts[m.loc.status] = (counts[m.loc.status] ?? 0) + 1;
    });
    return counts;
  }, [markers]);

  return (
    <>
      <PageHeader
        title="Live fleet"
        subtitle={`${markers.length} driver${markers.length === 1 ? '' : 's'} reporting GPS in the last 5 seconds.`}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <KpiCard label="Online" value={String(summary.online)} tone="success" />
        <KpiCard label="On trip" value={String(summary.on_trip)} tone="primary" />
        <KpiCard label="Offline" value={String(summary.offline)} tone="neutral" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        <Card padding={0} style={{ height: 560, overflow: 'hidden' }}>
          {MAPBOX_TOKEN ? (
            <FleetMap markers={markers} dark={mode === 'dark'} palette={palette} />
          ) : (
            <FleetMapFallback markers={markers} />
          )}
        </Card>

        <div>
          <SectionTitle>Live drivers</SectionTitle>
          {markers.length === 0 ? (
            <Card padding={0}>
              <EmptyState
                title="No drivers reporting"
                description="Drivers appear here once they go online and the app starts pushing GPS."
              />
            </Card>
          ) : (
            <Card padding={0}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 560,
                  overflowY: 'auto',
                }}
              >
                {markers.map((m, i) => (
                  <DriverRow
                    key={m.id}
                    marker={m}
                    isLast={i === markers.length - 1}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function DriverRow({ marker, isLast }: { marker: Marker; isLast: boolean }) {
  const { driver, loc } = marker;
  return (
    <div
      style={{
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : '1px solid var(--c-divider)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13 }}>{driver.name}</div>
        <DriverStatusPill status={loc.status} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--c-textMuted)', marginTop: 4 }}>
        {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.plate}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 6,
          fontSize: 11,
          color: 'var(--c-textMuted)',
        }}
      >
        <Pill tone="neutral">{Math.round(loc.speed)} km/h</Pill>
        <Pill tone="neutral">{formatRelative(loc.timestamp)}</Pill>
      </div>
    </div>
  );
}

// ─── Mapbox map ─────────────────────────────────────────────────────────────

function FleetMap({
  markers,
  dark,
  palette,
}: {
  markers: Marker[];
  dark: boolean;
  palette: { mapDriverOnline: string; mapDriverOnTrip: string; mapDriverOffline: string };
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<Record<string, mapboxgl.Marker>>({});

  // ── Init the map once ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: dark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12',
      center: AGBOR_CENTER,
      zoom: 12,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    return () => {
      Object.values(markerRefs.current).forEach((m) => m.remove());
      markerRefs.current = {};
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Swap style when theme changes ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(
      dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
    );
  }, [dark]);

  // ── Sync markers to driver locations ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    markers.forEach((m) => {
      seen.add(m.id);
      const lngLat: [number, number] = [m.loc.longitude, m.loc.latitude];
      const existing = markerRefs.current[m.id];
      if (existing) {
        existing.setLngLat(lngLat);
        const el = existing.getElement();
        const dot = el.firstChild as HTMLDivElement | null;
        if (dot) dot.style.background = colorFor(m.loc.status, palette);
      } else {
        const el = document.createElement('div');
        el.style.cursor = 'pointer';
        const dot = document.createElement('div');
        dot.style.width = '14px';
        dot.style.height = '14px';
        dot.style.borderRadius = '50%';
        dot.style.background = colorFor(m.loc.status, palette);
        dot.style.border = '2px solid #fff';
        dot.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';
        el.appendChild(dot);
        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-family:inherit;font-size:13px;line-height:1.4;">
             <div style="font-weight:600;">${escapeHtml(m.driver.name)}</div>
             <div style="color:#6B7280;">${escapeHtml(m.driver.vehicle.plate)}</div>
             <div style="color:#6B7280;">Status: ${escapeHtml(m.loc.status)}</div>
           </div>`,
        );
        const marker = new mapboxgl.Marker(el)
          .setLngLat(lngLat)
          .setPopup(popup)
          .addTo(map);
        markerRefs.current[m.id] = marker;
      }
    });

    // Drop markers that no longer exist.
    Object.keys(markerRefs.current).forEach((id) => {
      if (!seen.has(id)) {
        markerRefs.current[id]!.remove();
        delete markerRefs.current[id];
      }
    });
  }, [markers, palette]);

  return <div ref={containerRef} className="mapbox-fill" style={{ height: '100%' }} />;
}

function colorFor(
  s: DriverStatus,
  palette: { mapDriverOnline: string; mapDriverOnTrip: string; mapDriverOffline: string },
): string {
  if (s === 'online') return palette.mapDriverOnline;
  if (s === 'on_trip') return palette.mapDriverOnTrip;
  return palette.mapDriverOffline;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Token-missing fallback ─────────────────────────────────────────────────

function FleetMapFallback({ markers }: { markers: Marker[] }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        gap: 16,
      }}
    >
      <Banner tone="warning">
        <strong>Mapbox token missing.</strong> Add{' '}
        <code>VITE_MAPBOX_TOKEN</code> to <code>apps/staff-web/.env.local</code>{' '}
        to enable the live map. The list view below still updates in real-time.
      </Banner>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {markers.length === 0 ? (
          <EmptyState
            title="No drivers reporting"
            description="Once a driver goes online, they will appear here."
          />
        ) : (
          markers.map((m) => (
            <div
              key={m.id}
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--c-divider)',
              }}
            >
              <div style={{ fontWeight: 600 }}>{m.driver.name}</div>
              <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                {m.loc.latitude.toFixed(5)}, {m.loc.longitude.toFixed(5)} ·{' '}
                {Math.round(m.loc.speed)} km/h · {formatRelative(m.loc.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
