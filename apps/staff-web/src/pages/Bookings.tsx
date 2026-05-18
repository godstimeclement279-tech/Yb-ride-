import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pill,
  Select,
  Table,
  Toolbar,
  type TableColumn,
} from '../components/ui';
import { BookingStatusPill } from '../components/status';
import { useAllBookings, useAllDrivers } from '../hooks/useLiveData';
import { formatNaira, formatRelative } from '../utils/format';
import type { Booking, BookingStatus, Driver } from '@yb/shared';

type StatusFilter = 'all' | 'open' | BookingStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'Open (active work)' },
  { value: 'all', label: 'All statuses' },
  { value: 'paid', label: 'Awaiting assignment' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'driver_arrived', label: 'Driver arrived' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'pending_payment', label: 'Pending payment' },
];

const OPEN_STATUSES: BookingStatus[] = [
  'pending_payment',
  'paid',
  'assigned',
  'driver_arrived',
  'in_progress',
];

export function Bookings() {
  const navigate = useNavigate();
  const bookings = useAllBookings();
  const drivers = useAllDrivers();

  const [filter, setFilter] = useState<StatusFilter>('open');
  const [query, setQuery] = useState('');

  const driverById = useMemo(() => {
    const map: Record<string, Driver> = {};
    drivers.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [drivers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter === 'open' && !OPEN_STATUSES.includes(b.status)) return false;
      if (filter !== 'all' && filter !== 'open' && b.status !== filter) return false;
      if (!q) return true;
      const driver = b.driverId ? driverById[b.driverId] : undefined;
      return (
        b.id.toLowerCase().includes(q) ||
        b.pickup.formatted.toLowerCase().includes(q) ||
        b.dropoff.formatted.toLowerCase().includes(q) ||
        (b.paystackReference?.toLowerCase().includes(q) ?? false) ||
        (driver?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [bookings, filter, query, driverById]);

  const columns: TableColumn<Booking>[] = [
    {
      key: 'id',
      header: 'Booking',
      width: 120,
      render: (b) => (
        <div>
          <div style={{ fontWeight: 600 }}>{b.id}</div>
          <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
            {formatRelative(b.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (b) => (
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 360,
            }}
          >
            {b.pickup.formatted}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--c-textMuted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 360,
            }}
          >
            → {b.dropoff.formatted}
          </div>
        </div>
      ),
    },
    {
      key: 'car',
      header: 'Car',
      width: 100,
      render: (b) => <Pill tone="neutral">{b.fare.carTypeName}</Pill>,
    },
    {
      key: 'fare',
      header: 'Fare',
      width: 110,
      align: 'right',
      render: (b) => (
        <span style={{ fontWeight: 600 }}>{formatNaira(b.fare.total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 200,
      render: (b) => <BookingStatusPill status={b.status} acceptedAt={b.acceptedAt} />,
    },
    {
      key: 'driver',
      header: 'Driver',
      width: 180,
      render: (b) => {
        if (!b.driverId)
          return <span style={{ color: 'var(--c-textMuted)' }}>—</span>;
        const d = driverById[b.driverId];
        return (
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600 }}>{d?.name ?? b.driverId}</div>
            <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
              {d?.vehicle?.plate ?? '—'}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle={`${rows.length} booking${rows.length === 1 ? '' : 's'} matched.`}
      />

      <Toolbar>
        <div style={{ minWidth: 220, flex: 1, maxWidth: 360 }}>
          <Input
            placeholder="Search by ID, route, driver, paystack ref…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div style={{ minWidth: 220 }}>
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

      <Table<Booking>
        rows={rows}
        rowKey={(b) => b.id}
        onRowClick={(b) => navigate(`/bookings/${b.id}`)}
        columns={columns}
        empty={
          <Card padding={0}>
            <EmptyState
              title="No bookings match"
              description="Try clearing the search or switching the status filter."
            />
          </Card>
        }
      />
    </>
  );
}
