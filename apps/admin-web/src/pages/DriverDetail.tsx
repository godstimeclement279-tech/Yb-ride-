import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Booking, CarType, Driver } from '@yb/shared';
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
import { ApprovalPill, BookingStatusPill, DriverStatusPill } from '../components/status';
import { FIREBASE_CONFIGURED, getDb } from '../services/firebase';
import { subscribeCarTypes } from '../services/firebase/carTypesService';
import { subscribeBookings } from '../services/firebase/bookingsService';
import { setDriverActive } from '../services/firebase/driversService';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatNaira, formatRelative } from '../utils/format';

export function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const { admin } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
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
      doc(db, COLLECTIONS.DRIVERS, id),
      (snap) => {
        setDriver(snap.exists() ? ({ id: snap.id, ...snap.data() } as Driver) : null);
        setLoaded(true);
      },
      (err) => {
        console.warn('driver subscribe error', err);
        setLoaded(true);
      },
    );
  }, [id]);

  useEffect(() => subscribeCarTypes(setCarTypes), []);
  useEffect(() => subscribeBookings(setBookings), []);

  async function approveOrToggle() {
    if (!driver || !admin) return;
    setBusy(true);
    setError(null);
    try {
      await setDriverActive(driver.id, !driver.isActive, admin.id);
    } catch (e: unknown) {
      const msg = typeof e === 'object' && e && 'message' in e
        ? String((e as { message: unknown }).message)
        : 'Could not update driver.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return <EmptyState title="Loading driver…" description="" action={null} />;
  }

  if (!driver) {
    return (
      <EmptyState
        title="Driver not found"
        action={
          <Link to="/drivers">
            <Button variant="secondary">Back to drivers</Button>
          </Link>
        }
      />
    );
  }

  const carType = carTypes.find((c) => c.id === driver.carTypeId);
  const trips = bookings
    .filter((b) => b.driverId === driver.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  const docs = driver.documents ?? {};

  return (
    <>
      <PageHeader
        title={driver.name}
        subtitle={`${driver.phone} · ${driver.email}`}
        actions={
          <>
            <Link to="/drivers">
              <Button variant="secondary">Back</Button>
            </Link>
            <Button
              variant={driver.isActive ? 'danger' : 'primary'}
              onClick={approveOrToggle}
              disabled={busy}
            >
              {busy
                ? 'Working…'
                : !driver.approvedAt
                  ? 'Approve driver'
                  : driver.isActive
                    ? 'Suspend'
                    : 'Reinstate'}
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
              <DriverStatusPill status={driver.status} />
              <ApprovalPill approved={!!driver.approvedAt && driver.isActive} />
              {!driver.isActive && <Pill tone="error">Inactive</Pill>}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              <Stat label="Trips" value={(driver.totalTrips ?? 0).toLocaleString()} />
              <Stat label="Lifetime earnings" value={formatNaira(driver.totalEarningsKobo ?? 0)} />
              <Stat
                label="Average rating"
                value={driver.averageRating ? `${driver.averageRating.toFixed(2)} ★` : '—'}
              />
            </div>
          </Card>

          <Card>
            <SectionTitle>Vehicle</SectionTitle>
            {driver.vehicle ? (
              <>
                <StatRow
                  label="Make / model"
                  value={`${driver.vehicle.make} ${driver.vehicle.model}`}
                />
                <StatRow label="Year" value={driver.vehicle.year} />
                <StatRow label="Color" value={driver.vehicle.color} />
                <StatRow label="Plate" value={driver.vehicle.plate} />
                <StatRow label="Tier" value={carType?.name ?? '—'} />
              </>
            ) : (
              <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                No vehicle on file.
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Documents</SectionTitle>
            <DocRow
              label="Driver license"
              url={docs.licenseUrl}
              uploadedAt={docs.uploadedAt}
              verifiedAt={docs.verifiedAt}
            />
            <DocRow
              label="Vehicle papers"
              url={docs.vehiclePapersUrl}
              uploadedAt={docs.uploadedAt}
              verifiedAt={docs.verifiedAt}
            />
            <DocRow
              label="Insurance"
              url={docs.insuranceUrl}
              uploadedAt={docs.uploadedAt}
              verifiedAt={docs.verifiedAt}
            />
          </Card>

          <div>
            <SectionTitle>Recent trips</SectionTitle>
            <Table
              rows={trips.slice(0, 8)}
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
            <SectionTitle>Live location</SectionTitle>
            {driver.lastKnownLocation ? (
              <>
                <StatRow
                  label="Last update"
                  value={formatRelative(driver.lastLocationUpdate)}
                />
                <StatRow
                  label="Coordinates"
                  value={`${driver.lastKnownLocation.latitude.toFixed(4)}, ${driver.lastKnownLocation.longitude.toFixed(4)}`}
                />
              </>
            ) : (
              <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                Driver has not shared a location yet.
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Audit</SectionTitle>
            <StatRow label="Onboarded" value={formatDateTime(driver.createdAt)} />
            <StatRow
              label="Approved"
              value={driver.approvedAt ? formatDateTime(driver.approvedAt) : '—'}
            />
            <StatRow
              label="Updated"
              value={formatDateTime(driver.updatedAt)}
            />
            <StatRow label="ID" value={driver.id} />
          </Card>
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

function DocRow({
  label,
  url,
  uploadedAt,
  verifiedAt,
}: {
  label: string;
  url?: string;
  uploadedAt?: number;
  verifiedAt?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--c-divider)',
      }}
    >
      <div>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
          {url
            ? uploadedAt
              ? `Uploaded ${formatRelative(uploadedAt)}`
              : 'Uploaded'
            : 'Not uploaded'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {url ? (
          verifiedAt ? (
            <Pill tone="success">Verified</Pill>
          ) : (
            <Pill tone="warning">Awaiting review</Pill>
          )
        ) : (
          <Pill tone="neutral">Missing</Pill>
        )}
        {url && (
          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
            Open
          </a>
        )}
      </div>
    </div>
  );
}
