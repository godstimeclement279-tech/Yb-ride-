import type { BookingStatus, DriverStatus } from '@yb/shared';
import { Pill } from './ui';

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  switch (status) {
    case 'pending_payment':
      return <Pill tone="warning">Pending payment</Pill>;
    case 'paid':
      return <Pill tone="info">Paid · awaiting assignment</Pill>;
    case 'assigned':
      return <Pill tone="info">Assigned</Pill>;
    case 'driver_arrived':
      return <Pill tone="info">Driver arrived</Pill>;
    case 'in_progress':
      return <Pill tone="primary">In progress</Pill>;
    case 'completed':
      return <Pill tone="success">Completed</Pill>;
    case 'cancelled':
      return <Pill tone="error">Cancelled</Pill>;
  }
}

export function DriverStatusPill({ status }: { status: DriverStatus }) {
  switch (status) {
    case 'online':
      return <Pill tone="success">Online</Pill>;
    case 'on_trip':
      return <Pill tone="primary">On trip</Pill>;
    case 'offline':
      return <Pill tone="neutral">Offline</Pill>;
    case 'suspended':
      return <Pill tone="error">Suspended</Pill>;
  }
}

export function ApprovalPill({ approved }: { approved: boolean }) {
  return approved ? (
    <Pill tone="success">Approved</Pill>
  ) : (
    <Pill tone="warning">Pending review</Pill>
  );
}
