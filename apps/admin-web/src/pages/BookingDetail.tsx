import { Link, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, PageHeader, SectionTitle, StatRow } from '../components/ui';
import { BookingStatusPill } from '../components/status';
import { mockBookings, mockDrivers, mockPassengers, mockStaff } from '../data/mock';
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  formatNaira,
  formatRelative,
} from '../utils/format';

export function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const booking = mockBookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <EmptyState
        title="Booking not found"
        description={`No booking matched ID "${id ?? ''}".`}
        action={
          <Link to="/bookings">
            <Button variant="secondary">Back to bookings</Button>
          </Link>
        }
      />
    );
  }

  const passenger = mockPassengers.find((p) => p.id === booking.passengerId);
  const driver = booking.driverId ? mockDrivers.find((d) => d.id === booking.driverId) : undefined;
  const assignedBy = booking.staffAssignedBy
    ? mockStaff.find((s) => s.id === booking.staffAssignedBy)
    : undefined;

  const lifecycle: { label: string; ts?: number }[] = [
    { label: 'Created', ts: booking.createdAt },
    { label: 'Paid', ts: booking.paidAt },
    { label: 'Assigned to driver', ts: booking.assignedAt },
    { label: 'Driver arrived', ts: booking.driverArrivedAt },
    { label: 'Trip started', ts: booking.startedAt },
    { label: 'Completed', ts: booking.completedAt },
    { label: 'Cancelled', ts: booking.cancelledAt },
  ].filter((s) => s.ts !== undefined);

  return (
    <>
      <PageHeader
        title={`Booking ${booking.id}`}
        subtitle={`Created ${formatRelative(booking.createdAt)} · ${formatDateTime(booking.createdAt)}`}
        actions={
          <>
            <Link to="/bookings">
              <Button variant="secondary">Back</Button>
            </Link>
            {(booking.status === 'paid' || booking.status === 'assigned') && (
              <Button variant="danger">Cancel booking</Button>
            )}
          </>
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
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 16 }}>Status</h2>
              <BookingStatusPill status={booking.status} acceptedAt={booking.acceptedAt} />
            </div>
            <ol
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {lifecycle.map((step, i) => (
                <li
                  key={step.label}
                  style={{
                    display: 'flex',
                    gap: 14,
                    paddingBottom: i === lifecycle.length - 1 ? 0 : 14,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: 'var(--c-primary)',
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  {i < lifecycle.length - 1 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 4.5,
                        top: 16,
                        bottom: 0,
                        width: 1,
                        background: 'var(--c-divider)',
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-textMuted)' }}>
                      {formatDateTime(step.ts)}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {booking.cancellationReason && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: 'var(--c-divider)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <strong>Cancelled by {booking.cancelledBy}:</strong>{' '}
                {booking.cancellationReason}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Route</SectionTitle>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '12px 1fr',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--c-primary)',
                  marginTop: 4,
                }}
              />
              <div>
                <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>Pickup</div>
                <div style={{ fontWeight: 500 }}>{booking.pickup.label}</div>
                <div style={{ fontSize: 13 }}>{booking.pickup.formatted}</div>
              </div>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: 'var(--c-accent)',
                  marginTop: 4,
                }}
              />
              <div>
                <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>Dropoff</div>
                <div style={{ fontWeight: 500 }}>{booking.dropoff.label}</div>
                <div style={{ fontSize: 13 }}>{booking.dropoff.formatted}</div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle>Fare breakdown</SectionTitle>
            <StatRow label="Car type" value={booking.fare.carTypeName} />
            <StatRow label="Base fare" value={formatNaira(booking.fare.baseFare)} />
            <StatRow
              label={`Distance · ${formatDistance(booking.fare.estimatedDistanceKm)}`}
              value={formatNaira(booking.fare.distanceFare)}
            />
            {booking.fare.zoneSurcharge > 0 && (
              <StatRow
                label={`Zone surcharge · ${booking.fare.appliedZoneIds.join(', ')}`}
                value={formatNaira(booking.fare.zoneSurcharge)}
              />
            )}
            <StatRow
              label="Estimated duration"
              value={formatDuration(booking.fare.estimatedDurationMin)}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 12,
                marginTop: 4,
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              <span>Total</span>
              <span>{formatNaira(booking.fare.total)}</span>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <SectionTitle>Passenger</SectionTitle>
            {passenger ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{passenger.name}</div>
                <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>
                  {passenger.phone}
                </div>
                <div style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 12 }}>
                  {passenger.email}
                </div>
                <Link to={`/passengers/${passenger.id}`}>
                  <Button variant="secondary" size="sm">
                    View profile
                  </Button>
                </Link>
              </>
            ) : (
              <span style={{ color: 'var(--c-textMuted)' }}>{booking.passengerId}</span>
            )}
          </Card>

          <Card>
            <SectionTitle>Driver</SectionTitle>
            {driver ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{driver.name}</div>
                <div style={{ fontSize: 13, color: 'var(--c-textMuted)' }}>
                  {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.plate}
                </div>
                <div style={{ fontSize: 13, color: 'var(--c-textMuted)', marginBottom: 12 }}>
                  {driver.phone}
                </div>
                <Link to={`/drivers/${driver.id}`}>
                  <Button variant="secondary" size="sm">
                    View driver
                  </Button>
                </Link>
              </>
            ) : (
              <div style={{ color: 'var(--c-textMuted)', fontSize: 13 }}>
                Not yet assigned.
              </div>
            )}
            {assignedBy && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid var(--c-divider)',
                  fontSize: 12,
                  color: 'var(--c-textMuted)',
                }}
              >
                Assigned by <strong>{assignedBy.name}</strong>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Payment</SectionTitle>
            <StatRow label="Method" value={booking.paymentMethod ?? '—'} />
            <StatRow label="Reference" value={booking.paystackReference ?? '—'} />
            <StatRow label="Round trip" value={booking.isRoundTrip ? 'Yes' : 'No'} />
          </Card>

          {(booking.ratingFromPassenger || booking.ratingFromDriver) && (
            <Card>
              <SectionTitle>Ratings</SectionTitle>
              {booking.ratingFromPassenger && (
                <StatRow
                  label="From passenger"
                  value={`${booking.ratingFromPassenger.stars}★${booking.ratingFromPassenger.comment ? ` — ${booking.ratingFromPassenger.comment}` : ''}`}
                />
              )}
              {booking.ratingFromDriver && (
                <StatRow
                  label="From driver"
                  value={`${booking.ratingFromDriver.stars}★`}
                />
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
