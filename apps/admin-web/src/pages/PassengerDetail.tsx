import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Booking, Passenger } from '@yb/shared';
import { COLLECTIONS } from '@yb/shared';
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
import { FIREBASE_CONFIGURED, getDb } from '../services/firebase';
import { subscribeBookings } from '../services/firebase/bookingsService';
import { setPassengerActive } from '../services/firebase/passengersService';
import { formatDateTime, formatNaira, formatRelative } from '../utils/format';

export function PassengerDetail() {
  const { id } = useParams<{ id: string }>();
  const [passenger, setPassenger] = useState<Passenger | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !FIREBASE_CONFIGURED) {
      setLoaded(true);
      return;
    }
    const db = getDb()!;
    return onSnapshot(
      doc(db, COLLECTIONS.USERS, id),
      (snap) => {
        setPassenger(snap.exists() ? ({ id: snap.id, ...snap.data() } as Passenger) : null);
        setLoaded(true);
      },
      (err) => {
        if (import.meta.env.DEV) console.warn('passenger subscribe error', err);
        setLoaded(true);
      },
    );
  }, [id]);

  useEffect(() => subscribeBookings(setBookings), []);

  async function toggleActive() {
    if (!passenger) return;
    setBusy(true);
    setError(null);
    try {
      await setPassengerActive(passenger.id, !passenger.isActive);
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e
        ? String((e as { message: unknown }).message)
        : 'Could not update passenger.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return <EmptyState title="Loading passenger…" description="" action={null} />;
  }

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

  const trips = bookings
    .filter((b) => b.passengerId === passenger.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const completed = trips.filter((t) => t.status === 'completed');
  const totalSpend = completed.reduce((sum, t) => sum + (t.fare?.total ?? 0), 0);

  return (
    <>
      <PageHeader
        title={passenger.name}
        subtitle={`${passenger.phone} · ${passenger.email}`}
        actions={
          <>
            <Link to="/passengers">
              <Button variant="secondary">Back</Button>
            </Link>
            <Button
              variant={passenger.isActive ? 'danger' : 'primary'}
              onClick={toggleActive}
              disabled={busy}
            >
              {busy ? 'Working…' : passenger.isActive ? 'Suspend' : 'Reactivate'}
            </Button>
          </>
        }
      />

      {error && (
        <div
          style={{
            margin: '0 0 12px',
            padding: 10,
            background: 'var(--c-errorSoft)',
            color: 'var(--c-error)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

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
                <Pill tone="neutral">Suspended</Pill>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              <Stat label="Trips" value={(passenger.totalTrips ?? 0).toLocaleString()} />
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
                      {b.id.slice(0, 6).toUpperCase()}
                    </Link>
                  ),
                },
                {
                  key: 'route',
                  header: 'Route',
                  render: (b) => (
                    <span style={{ fontSize: 13 }}>
                      {b.pickup?.label ?? '—'} → {b.dropoff?.label ?? '—'}
                    </span>
                  ),
                },
                {
                  key: 'fare',
                  header: 'Fare',
                  render: (b) => formatNaira(b.fare?.total ?? 0),
                  align: 'right',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (b) => (
                    <BookingStatusPill status={b.status} acceptedAt={b.acceptedAt} />
                  ),
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
