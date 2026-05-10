import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pill,
  SectionTitle,
  StatRow,
  Table,
} from '../components/ui';
import { BookingStatusPill } from '../components/status';
import { mockBookings, mockPassengers } from '../data/mock';
import { formatDateTime, formatNaira, formatRelative } from '../utils/format';

export function PassengerDetail() {
  const { id } = useParams<{ id: string }>();
  const passenger = mockPassengers.find((p) => p.id === id);

  if (!passenger) {
    return (
      <EmptyState
        title="Passenger not found"
        action={
          <Link to="/passengers">
            <Button variant="secondary">Back to passengers</Button>
          </Link>
        }
      />
    );
  }

  const trips = mockBookings
    .filter((b) => b.passengerId === passenger.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const completed = trips.filter((t) => t.status === 'completed');
  const totalSpend = completed.reduce((sum, t) => sum + t.fare.total, 0);

  return (
    <>
      <PageHeader
        title={passenger.name}
        subtitle={`${passenger.phone} · ${passenger.email}`}
        actions={
          <Link to="/passengers">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              {passenger.isActive ? (
                <Pill tone="success">Active</Pill>
              ) : (
                <Pill tone="neutral">Inactive</Pill>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              <Stat label="Trips" value={passenger.totalTrips.toLocaleString()} />
              <Stat label="Lifetime spend" value={formatNaira(totalSpend)} />
              <Stat
                label="Average rating"
                value={passenger.averageRating ? `${passenger.averageRating.toFixed(2)} ★` : '—'}
              />
            </div>
          </Card>

          <div>
            <SectionTitle>Trip history</SectionTitle>
            <Table
              rows={trips}
              rowKey={(r) => r.id}
              empty={<EmptyState title="No trips yet" />}
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
                    <span style={{ fontSize: 13 }}>
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
                  render: (b) => <BookingStatusPill status={b.status} />,
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <SectionTitle>Account</SectionTitle>
            <StatRow label="Joined" value={formatDateTime(passenger.createdAt)} />
            <StatRow label="Updated" value={formatDateTime(passenger.updatedAt)} />
            <StatRow
              label="Default payment"
              value={passenger.defaultPaymentMethod ?? '—'}
            />
            <StatRow label="ID" value={passenger.id} />
          </Card>

          {passenger.savedAddresses && passenger.savedAddresses.length > 0 && (
            <Card>
              <SectionTitle>Saved addresses</SectionTitle>
              {passenger.savedAddresses.map((a) => (
                <StatRow key={a.id} label={a.label} value={a.formatted} />
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--c-textMuted)',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
