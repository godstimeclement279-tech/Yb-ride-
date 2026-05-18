import { Link } from 'react-router-dom';
import { Card, KpiCard, PageHeader, SectionTitle, Table } from '../components/ui';
import { BookingStatusPill, DriverStatusPill } from '../components/status';
import { mockBookings, mockDrivers } from '../data/mock';
import { formatNaira } from '../utils/format';
import { formatRelative } from '../utils/format';

const day = 24 * 60 * 60 * 1000;

function todayBookings() {
  const since = Date.now() - 1 * day;
  return mockBookings.filter((b) => b.createdAt >= since);
}

function activeBookings() {
  return mockBookings.filter((b) =>
    ['paid', 'assigned', 'driver_arrived', 'in_progress'].includes(b.status),
  );
}

function revenueLast24h(): number {
  const since = Date.now() - 1 * day;
  return mockBookings
    .filter((b) => b.status === 'completed' && (b.completedAt ?? 0) >= since)
    .reduce((sum, b) => sum + b.fare.total, 0);
}

function onlineDriverCount(): number {
  return mockDrivers.filter((d) => d.status === 'online' || d.status === 'on_trip').length;
}

export function Dashboard() {
  const recent = [...mockBookings]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const onlineDrivers = mockDrivers
    .filter((d) => d.status !== 'offline' && d.status !== 'suspended')
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back. Here's what's happening across YB Ride right now.`}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard
          label="Bookings · 24h"
          value={String(todayBookings().length)}
          delta={`${activeBookings().length} active right now`}
          tone="primary"
        />
        <KpiCard
          label="Revenue · 24h"
          value={formatNaira(revenueLast24h())}
          delta="Completed trips only"
          tone="success"
        />
        <KpiCard
          label="Drivers online"
          value={`${onlineDriverCount()} / ${mockDrivers.filter((d) => d.isActive).length}`}
          delta={`${mockDrivers.filter((d) => d.status === 'on_trip').length} on trip`}
          tone="info"
        />
        <KpiCard
          label="Pending approvals"
          value={String(mockDrivers.filter((d) => !d.approvedAt).length)}
          delta="Drivers awaiting review"
          tone="warning"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <SectionTitle>Recent bookings</SectionTitle>
            <Link to="/bookings" style={{ fontSize: 13 }}>
              View all →
            </Link>
          </div>
          <Table
            rows={recent}
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
              },
              {
                key: 'route',
                header: 'Route',
                render: (b) => (
                  <span style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                    {b.pickup.label} → {b.dropoff.label}
                  </span>
                ),
              },
              {
                key: 'fare',
                header: 'Fare',
                render: (b) => formatNaira(b.fare.total),
                align: 'right',
              },
              {
                key: 'status',
                header: 'Status',
                render: (b) => <BookingStatusPill status={b.status} acceptedAt={b.acceptedAt} />,
              },
              {
                key: 'when',
                header: 'When',
                render: (b) => (
                  <span style={{ color: 'var(--c-textMuted)' }}>
                    {formatRelative(b.createdAt)}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div>
          <SectionTitle>Active drivers</SectionTitle>
          <Card padding={0}>
            {onlineDrivers.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--c-textMuted)', fontSize: 13 }}>
                No drivers online right now.
              </div>
            ) : (
              onlineDrivers.map((d, i) => (
                <Link
                  key={d.id}
                  to={`/drivers/${d.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom:
                      i === onlineDrivers.length - 1
                        ? 'none'
                        : '1px solid var(--c-divider)',
                    color: 'var(--c-text)',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--c-divider)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {d.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--c-textMuted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {d.vehicle.make} {d.vehicle.model} · {d.vehicle.plate}
                    </div>
                  </div>
                  <DriverStatusPill status={d.status} />
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
