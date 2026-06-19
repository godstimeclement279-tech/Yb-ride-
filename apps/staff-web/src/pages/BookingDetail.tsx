import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Pill,
  SectionTitle,
  StatRow,
  Textarea,
} from '../components/ui';
import { BookingStatusPill, DriverStatusPill } from '../components/status';
import {
  useAssignableDrivers,
  useBooking,
  useDriver,
  usePassenger,
} from '../hooks/useLiveData';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatNaira, formatRelative } from '../utils/format';
import {
  assignDriver,
  cancelBooking,
} from '../services/firebase/bookingsService';
import { FIREBASE_CONFIGURED } from '../services/firebase';
import type { Driver } from '@yb/shared';

export function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { booking, loading } = useBooking(id);
  const driver = useDriver(booking?.driverId);
  const passenger = usePassenger(booking?.passengerId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <div style={{ padding: 20, color: 'var(--c-textMuted)' }}>Loading booking…</div>
      </Card>
    );
  }
  if (!booking) {
    return (
      <Card padding={0}>
        <EmptyState
          title="Booking not found"
          description="It may have been deleted, or the ID is wrong."
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/bookings')}>
              Back to bookings
            </Button>
          }
        />
      </Card>
    );
  }

  const canAssign = staff?.permissions.includes('assign_drivers') ?? false;
  const canCancel = staff?.permissions.includes('cancel_bookings') ?? false;
  const canStillAssign = booking.status === 'paid';
  const canStillCancel =
    booking.status !== 'completed' && booking.status !== 'cancelled';

  return (
    <>
      <PageHeader
        title={`Booking ${booking.id}`}
        subtitle={`Created ${formatRelative(booking.createdAt)} · ${formatDateTime(booking.createdAt)}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
            ← Back
          </Button>
        }
      />

      <div style={{ marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <BookingStatusPill status={booking.status} acceptedAt={booking.acceptedAt} />
        <Pill tone="neutral">{booking.fare.carTypeName}</Pill>
        {booking.isRoundTrip && <Pill tone="info">Round trip</Pill>}
        {booking.paymentMethod && (
          <Pill tone="neutral">
            {booking.paymentMethod === 'card'
              ? 'Card'
              : booking.paymentMethod === 'bank_transfer'
              ? 'Bank transfer'
              : 'Wallet'}
          </Pill>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 20,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'grid', gap: 20 }}>
          <Card>
            <SectionTitle>Trip</SectionTitle>
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginBottom: 10,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--c-accent)',
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>Pickup</div>
                <div style={{ fontWeight: 600 }}>{booking.pickup.label}</div>
                <div style={{ fontSize: 13 }}>{booking.pickup.formatted}</div>
              </div>
            </div>
            <div
              style={{
                marginLeft: 5,
                width: 2,
                height: 16,
                background: 'var(--c-divider)',
              }}
            />
            <div
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--c-primary)',
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>Dropoff</div>
                <div style={{ fontWeight: 600 }}>{booking.dropoff.label}</div>
                <div style={{ fontSize: 13 }}>{booking.dropoff.formatted}</div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Fare breakdown</SectionTitle>
            <StatRow label="Base fare" value={formatNaira(booking.fare.baseFare)} />
            <StatRow
              label={`Distance fare (${booking.fare.estimatedDistanceKm.toFixed(1)} km)`}
              value={formatNaira(booking.fare.distanceFare)}
            />
            {booking.fare.zoneSurcharge > 0 && (
              <StatRow
                label={`Zone surcharge${booking.fare.appliedZoneIds.length ? ` · ${booking.fare.appliedZoneIds.length} zone${booking.fare.appliedZoneIds.length === 1 ? '' : 's'}` : ''}`}
                value={formatNaira(booking.fare.zoneSurcharge)}
              />
            )}
            <StatRow
              label="Total"
              value={
                <span style={{ fontSize: 16, color: 'var(--c-primary)' }}>
                  {formatNaira(booking.fare.total)}
                </span>
              }
            />
          </Card>

          <Card>
            <SectionTitle>Lifecycle</SectionTitle>
            <StatRow label="Created" value={formatDateTime(booking.createdAt)} />
            <StatRow label="Paid" value={formatDateTime(booking.paidAt)} />
            <StatRow label="Assigned" value={formatDateTime(booking.assignedAt)} />
            <StatRow
              label="Driver arrived"
              value={formatDateTime(booking.driverArrivedAt)}
            />
            <StatRow label="Started" value={formatDateTime(booking.startedAt)} />
            <StatRow label="Completed" value={formatDateTime(booking.completedAt)} />
            <StatRow label="Cancelled" value={formatDateTime(booking.cancelledAt)} />
            {booking.cancellationReason && (
              <StatRow
                label="Cancellation reason"
                value={`${booking.cancellationReason} (by ${booking.cancelledBy ?? '—'})`}
              />
            )}
            {booking.paystackReference && (
              <StatRow label="Paystack ref" value={booking.paystackReference} />
            )}
            {booking.staffAssignedBy && (
              <StatRow label="Assigned by" value={booking.staffAssignedBy} />
            )}
          </Card>
        </div>

        <div style={{ display: 'grid', gap: 20, position: 'sticky', top: 80 }}>
          <Card>
            <SectionTitle>Actions</SectionTitle>
            {!canAssign && !canCancel && (
              <Banner tone="info">No staff actions available for your role.</Banner>
            )}
            {canAssign && (
              <Button
                onClick={() => setAssignOpen(true)}
                disabled={!canStillAssign}
                style={{ width: '100%', marginBottom: 8 }}
              >
                {booking.driverId ? 'Reassign driver' : 'Assign driver'}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                onClick={() => setCancelOpen(true)}
                disabled={!canStillCancel}
                style={{ width: '100%' }}
              >
                Cancel booking
              </Button>
            )}
            {!canStillAssign && booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--c-textMuted)',
                  marginTop: 8,
                }}
              >
                Driver already assigned. Use Reassign if you need to change them.
              </div>
            )}
          </Card>

          {passenger && (
            <Card>
              <SectionTitle>Passenger</SectionTitle>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{passenger.name}</div>
              <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>
                {passenger.phone}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--c-textMuted)',
                  marginTop: 6,
                }}
              >
                {passenger.totalTrips} lifetime trip{passenger.totalTrips === 1 ? '' : 's'}
                {passenger.averageRating
                  ? ` · ${passenger.averageRating.toFixed(1)}★`
                  : ''}
              </div>
            </Card>
          )}

          {driver && (
            <Card>
              <SectionTitle>Driver</SectionTitle>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div>
                  {/* Plain text — DriverDetail page (/drivers/:id) isn't
                      registered yet. Re-add <Link> once it lands. */}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {driver.name}
                  </span>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--c-textMuted)',
                      marginTop: 2,
                    }}
                  >
                    {driver.phone}
                  </div>
                </div>
                <DriverStatusPill status={driver.status} />
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                Plate {driver.vehicle.plate}
              </div>
            </Card>
          )}
        </div>
      </div>

      <AssignDriverModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        bookingId={booking.id}
        currentDriverId={booking.driverId}
        staffUid={staff?.id ?? 'unknown'}
      />
      <CancelBookingModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        bookingId={booking.id}
        staffUid={staff?.id ?? 'unknown'}
      />
    </>
  );
}

// ─── Assign driver modal ────────────────────────────────────────────────────

function AssignDriverModal({
  open,
  onClose,
  bookingId,
  currentDriverId,
  staffUid,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  currentDriverId?: string;
  staffUid: string;
}) {
  const candidates = useAssignableDrivers();
  const [selected, setSelected] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => a.name.localeCompare(b.name)),
    [candidates],
  );

  async function confirm(): Promise<void> {
    if (!selected) {
      setError('Pick a driver first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await assignDriver(bookingId, selected, staffUid);
      onClose();
      setSelected('');
    } catch (e) {
      if (import.meta.env.DEV) console.warn(e);
      setError('Could not assign driver. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={currentDriverId ? 'Reassign driver' : 'Assign driver'}
      width={520}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void confirm();
            }}
            disabled={submitting || !selected}
          >
            {submitting ? 'Assigning…' : 'Confirm assignment'}
          </Button>
        </>
      }
    >
      {!FIREBASE_CONFIGURED && (
        <Banner tone="warning">
          Demo mode — assignment is not persisted. Wire up Firebase to make this
          live.
        </Banner>
      )}
      {sorted.length === 0 ? (
        <EmptyState
          title="No drivers online"
          description="Wait for a driver to come online or call one in."
        />
      ) : (
        <div style={{ display: 'grid', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {sorted.map((d) => (
            <DriverPickRow
              key={d.id}
              driver={d}
              selected={selected === d.id}
              isCurrent={currentDriverId === d.id}
              onSelect={() => setSelected(d.id)}
            />
          ))}
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: 12,
            color: 'var(--c-error)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </Modal>
  );
}

function DriverPickRow({
  driver,
  selected,
  isCurrent,
  onSelect,
}: {
  driver: Driver;
  selected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        textAlign: 'left',
        width: '100%',
        // 250,204,21 = brand yellow #FACC15. Was Stripe ink blue
        // rgba(30,58,138) from the deprecated palette; missed in the revert.
        background: selected ? 'rgba(250,204,21,0.15)' : 'var(--c-surface)',
        border: `1px solid ${selected ? 'var(--c-primary)' : 'var(--c-border)'}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--c-divider)',
          color: 'var(--c-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {driver.name
          .split(' ')
          .slice(0, 2)
          .map((p) => p.charAt(0).toUpperCase())
          .join('')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 600 }}>{driver.name}</span>
          <DriverStatusPill status={driver.status} />
          {isCurrent && <Pill tone="info">Current</Pill>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
          {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.plate}
          {driver.averageRating ? ` · ${driver.averageRating.toFixed(1)}★` : ''}
        </div>
      </div>
    </button>
  );
}

// ─── Cancel booking modal ──────────────────────────────────────────────────

function CancelBookingModal({
  open,
  onClose,
  bookingId,
  staffUid,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  staffUid: string;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(): Promise<void> {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A reason is required so the passenger and driver are informed.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await cancelBooking(bookingId, trimmed, staffUid);
      onClose();
      setReason('');
    } catch (e) {
      if (import.meta.env.DEV) console.warn(e);
      setError('Could not cancel. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel booking"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Keep booking
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              void confirm();
            }}
            disabled={submitting}
          >
            {submitting ? 'Cancelling…' : 'Confirm cancel'}
          </Button>
        </>
      }
    >
      <Banner tone="warning">
        Cancelling notifies the passenger and driver. The fare is not refunded
        automatically — admin handles refunds.
      </Banner>
      <Field label="Reason" hint="Visible to the passenger.">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Driver unavailable, passenger requested cancel, etc."
        />
      </Field>
      {error && (
        <div style={{ marginTop: 10, color: 'var(--c-error)', fontSize: 13 }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
