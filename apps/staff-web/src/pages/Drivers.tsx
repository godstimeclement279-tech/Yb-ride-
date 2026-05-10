import { useMemo, useState } from 'react';
import {
  Card,
  EmptyState,
  Input,
  KpiCard,
  PageHeader,
  Pill,
  Select,
  Table,
  Toolbar,
  type TableColumn,
} from '../components/ui';
import { DriverStatusPill } from '../components/status';
import { useAllDrivers, useFleetLocations } from '../hooks/useLiveData';
import { formatNaira, formatRelative } from '../utils/format';
import type { Driver, DriverStatus } from '@yb/shared';

type StatusFilter = 'all' | DriverStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'online', label: 'Online' },
  { value: 'on_trip', label: 'On trip' },
  { value: 'offline', label: 'Offline' },
  { value: 'suspended', label: 'Suspended' },
];

export function Drivers() {
  const drivers = useAllDrivers();
  const fleet = useFleetLocations();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');

  const summary = useMemo(() => {
    return {
      total: drivers.filter((d) => d.isActive).length,
      online: drivers.filter((d) => d.status === 'online').length,
      onTrip: drivers.filter((d) => d.status === 'on_trip').length,
      offline: drivers.filter((d) => d.status === 'offline').length,
    };
  }, [drivers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drivers.filter((d) => {
      if (filter !== 'all' && d.status !== filter) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.vehicle.plate.toLowerCase().includes(q) ||
        d.vehicle.make.toLowerCase().includes(q) ||
        d.vehicle.model.toLowerCase().includes(q)
      );
    });
  }, [drivers, filter, query]);

  const columns: TableColumn<Driver>[] = [
    {
      key: 'name',
      header: 'Driver',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 600 }}>{d.name}</div>
          <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>{d.phone}</div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (d) => (
        <div>
          <div style={{ fontSize: 13 }}>
            {d.vehicle.color} {d.vehicle.make} {d.vehicle.model}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
            {d.vehicle.plate}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: (d) => <DriverStatusPill status={d.status} />,
    },
    {
      key: 'lastSeen',
      header: 'Last GPS ping',
      width: 160,
      render: (d) => {
        const live = fleet[d.id];
        const ts = live?.timestamp ?? d.lastLocationUpdate;
        return (
          <span style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>
            {ts ? formatRelative(ts) : '—'}
          </span>
        );
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      width: 100,
      align: 'right',
      render: (d) =>
        d.averageRating ? (
          <Pill tone="success">{d.averageRating.toFixed(1)}★</Pill>
        ) : (
          <span style={{ color: 'var(--c-textMuted)' }}>—</span>
        ),
    },
    {
      key: 'trips',
      header: 'Trips',
      width: 90,
      align: 'right',
      render: (d) => <span style={{ fontWeight: 600 }}>{d.totalTrips}</span>,
    },
    {
      key: 'earnings',
      header: 'Earnings',
      width: 130,
      align: 'right',
      render: (d) => formatNaira(d.totalEarningsKobo),
    },
  ];

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle={`${summary.total} active driver${summary.total === 1 ? '' : 's'} on file.`}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard label="Online" value={String(summary.online)} tone="success" />
        <KpiCard label="On trip" value={String(summary.onTrip)} tone="primary" />
        <KpiCard label="Offline" value={String(summary.offline)} tone="neutral" />
      </div>

      <Toolbar>
        <div style={{ minWidth: 220, flex: 1, maxWidth: 360 }}>
          <Input
            placeholder="Search by name, plate, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </Toolbar>

      <Table<Driver>
        rows={rows}
        rowKey={(d) => d.id}
        columns={columns}
        empty={
          <Card padding={0}>
            <EmptyState
              title="No drivers match"
              description="Try clearing the search or status filter."
            />
          </Card>
        }
      />
    </>
  );
}
