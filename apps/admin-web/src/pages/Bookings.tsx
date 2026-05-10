import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BookingStatus } from '@yb/shared';
import { Input, PageHeader, Pill, Select, Table, Toolbar } from '../components/ui';
import { BookingStatusPill } from '../components/status';
import { mockBookings, mockDrivers, mockPassengers } from '../data/mock';
import { formatDateTime, formatNaira, formatRelative } from '../utils/format';

const STATUSES: ('all' | BookingStatus)[] = [
  'all',
  'pending_payment',
  'paid',
  'assigned',
  'driver_arrived',
  'in_progress',
  'completed',
  'cancelled',
];

const passengerById = (id: string) => mockPassengers.find((p) => p.id === id);
const driverById = (id?: string) => (id ? mockDrivers.find((d) => d.id === id) : undefined);

export function Bookings() {
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...mockBookings]
      .filter((b) => statusFilter === 'all' || b.status === statusFilter)
      .filter((b) => {
        if (!q) return true;
        const passenger = passengerById(b.passengerId);
        return (
          b.id.toLowerCase().includes(q) ||
          passenger?.name.toLowerCase().includes(q) ||
          passenger?.phone.includes(q) ||
          b.pickup.formatted.toLowerCase().includes(q) ||
          b.dropoff.formatted.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [statusFilter, search]);

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Every paid trip in the system. Drill in for full lifecycle and rating details."
      />

      <Toolbar>
        <Input
          placeholder="Search ID, passenger, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | BookingStatus)}
          style={{ maxWidth: 220 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <span style={{ marginLeft: 'auto', color: 'var(--c-textMuted)', fontSize: 13 }}>
          {rows.length} of {mockBookings.length}
        </span>
      </Toolbar>

      <Table
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            key: 'id',
            header: 'ID',
            render: (b) => (
              <Link to={`/bookings/${b.id}`} style={{ fontWeight: 600 }}>
                {b.id}
              </Link>
            ),
            width: 100,
          },
          {
            key: 'passenger',
            header: 'Passenger',
            render: (b) => {
              const p = passengerById(b.passengerId);
              return (
                <div>
                  <div style={{ fontWeight: 500 }}>{p?.name ?? b.passengerId}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                    {p?.phone}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'route',
            header: 'Route',
            render: (b) => (
              <div style={{ maxWidth: 320 }}>
                <div style={{ fontSize: 13 }}>{b.pickup.formatted}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                  → {b.dropoff.formatted}
                </div>
              </div>
            ),
          },
          {
            key: 'driver',
            header: 'Driver',
            render: (b) => {
              const d = driverById(b.driverId);
              if (!d) return <span style={{ color: 'var(--c-textMuted)' }}>—</span>;
              return (
                <Link to={`/drivers/${d.id}`} style={{ fontWeight: 500 }}>
                  {d.name}
                </Link>
              );
            },
          },
          {
            key: 'fare',
            header: 'Fare',
            render: (b) => (
              <div>
                <div style={{ fontWeight: 600 }}>{formatNaira(b.fare.total)}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                  {b.fare.carTypeName}
                </div>
              </div>
            ),
            align: 'right',
          },
          {
            key: 'status',
            header: 'Status',
            render: (b) => <BookingStatusPill status={b.status} />,
          },
          {
            key: 'when',
            header: 'Created',
            render: (b) => (
              <div>
                <div style={{ fontSize: 13 }}>{formatRelative(b.createdAt)}</div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                  {formatDateTime(b.createdAt)}
                </div>
              </div>
            ),
          },
          {
            key: 'roundtrip',
            header: '',
            render: (b) => (b.isRoundTrip ? <Pill tone="info">Round trip</Pill> : null),
            width: 90,
          },
        ]}
      />
    </>
  );
}
