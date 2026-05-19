import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  KpiCard,
  PageHeader,
  SectionTitle,
} from '../components/ui';
import { BookingStatusPill, DriverStatusPill } from '../components/status';
import { useAllBookings, useAllDrivers } from '../hooks/useLiveData';
import { useNewBookingAlert } from '../hooks/useNewBookingAlert';
import { useAuth } from '../context/AuthContext';
import { formatNaira, formatRelative } from '../utils/format';
import type { Booking } from '@yb/shared';

export function Dashboard() {
  const { staff } = useAuth();
  const bookings = useAllBookings();
  const drivers = useAllDrivers();
  useNewBookingAlert(bookings);

  const stats = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const today = bookings.filter((b) => b.createdAt >= oneDayAgo);
    const completed = bookings.filter((b) => b.status === 'completed');
    const revenueKobo = completed.reduce((s, b) => s + b.fare.total, 0);
    return {
      needsAssignment: bookings.filter((b) => b.status === 'paid').length,
      active: bookings.filter((b) =>
        ['assigned', 'driver_arrived', 'in_progress'].includes(b.status),
      ).length,
      todayCount: today.length,
      completedCount: completed.length,
      revenue: revenueKobo,
      driversOnline: drivers.filter((d) => d.status === 'online' && d.isActive).length,
      driversOnTrip: drivers.filter((d) => d.status === 'on_trip').length,
      driversTotal: drivers.filter((d) => d.isActive).length,
    };
  }, [bookings, drivers]);

  const queue = useMemo(
    () => bookings.filter((b) => b.status === 'paid').slice(0, 6),
    [bookings],
  );
  const active = useMemo(
    () =>
      bookings
        .filter((b) =>
          ['assigned', 'driver_arrived', 'in_progress'].includes(b.status),
        )
        .slice(0, 6),
    [bookings],
  );

  const canAssign = staff?.permissions.includes('assign_drivers');

  return (
    <>
      <PageHeader
        title={`Welcome, ${staff?.name?.split(' ')[0] ?? 'team'}`}
        subtitle="Live operations overview — bookings, fleet, revenue today."
      />

      {!canAssign && (
        <Banner tone="warning">
          You don&apos;t have <strong>assign_drivers</strong> permission. You can
          watch the queue but not assign — ask an admin to grant it.
        </Banner>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <KpiCard
          label="Needs assignment"
          value={String(stats.needsAssignment)}
          tone={stats.needsAssignment > 0 ? 'warning' : 'success'}
          delta={stats.needsAssignment > 0 ? 'Action required' : 'All clear'}
        />
        <KpiCard
          label="Active trips"
          value={String(stats.active)}
          tone="primary"
          delta={`${stats.driversOnTrip} driver${stats.driversOnTrip === 1 ? '' : 's'} on trip`}
        />
        <KpiCard
          label="Drivers online"
          value={`${stats.driversOnline} / ${stats.driversTotal}`}
          tone="success"
          delta="Available now"
        />
        <KpiCard
          label="Today's bookings"
          value={String(stats.todayCount)}
          tone="info"
          delta={`${stats.completedCount} completed lifetime`}
        />
        <KpiCard
          label="Revenue (lifetime)"
          value={formatNaira(stats.revenue)}
          tone="success"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        <div>
          <SectionTitle>Awaiting assignment</SectionTitle>
          <BookingLane
            bookings={queue}
            ctaLabel="Assign"
            ctaTone="primary"
            emptyTitle="Queue empty"
            emptyDescription="No bookings are waiting for a driver."
          />
        </div>
        <div>
          <SectionTitle>Active trips</SectionTitle>
          <BookingLane
            bookings={active}
            ctaLabel="View"
            ctaTone="secondary"
            emptyTitle="Nothing live"
            emptyDescription="No trips are in progress right now."
          />
        </div>
      </div>
    </>
  );
}

function BookingLane({
  bookings,
  ctaLabel,
  ctaTone,
  emptyTitle,
  emptyDescription,
}: {
  bookings: Booking[];
  ctaLabel: string;
  ctaTone: 'primary' | 'secondary';
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (bookings.length === 0) {
    return (
      <Card padding={0}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Card>
    );
  }
  return (
    <Card padding={0}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {bookings.map((b, i) => (
          <div
            key={b.id}
            style={{
              padding: '14px 16px',
              borderBottom:
                i === bookings.length - 1 ? 'none' : '1px solid var(--c-divider)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13 }}>{b.id}</span>
                <BookingStatusPill status={b.status} acceptedAt={b.acceptedAt} />
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--c-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {b.pickup.formatted} → {b.dropoff.formatted}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-textMuted)', marginTop: 2 }}>
                {b.fare.carTypeName} · {formatNaira(b.fare.total)} ·{' '}
                {formatRelative(b.createdAt)}
              </div>
            </div>
            <Link
              to={`/bookings/${b.id}`}
              style={{
                textDecoration: 'none',
              }}
            >
              <Button variant={ctaTone} size="sm">
                {ctaLabel}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DriverGlance() {
  const drivers = useAllDrivers();
  return (
    <Card>
      <div style={{ marginBottom: 12 }}>
        <strong style={{ fontSize: 14 }}>Fleet snapshot</strong>
      </div>
      {drivers.slice(0, 5).map((d) => (
        <div
          key={d.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--c-divider)',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
            <div style={{ fontSize: 11, color: 'var(--c-textMuted)' }}>
              {d.vehicle.make} {d.vehicle.model} · {d.vehicle.plate}
            </div>
          </div>
          <DriverStatusPill status={d.status} />
        </div>
      ))}
    </Card>
  );
}
