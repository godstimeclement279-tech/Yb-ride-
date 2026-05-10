import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import type { BookingStatus, DriverStatus } from '@yb/shared';

type Status = BookingStatus | DriverStatus;

const LABELS: Record<Status, string> = {
  pending_payment: 'Pending payment',
  paid: 'New trip',
  assigned: 'Assigned',
  driver_arrived: 'Arrived',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  offline: 'Offline',
  online: 'Online',
  on_trip: 'On trip',
  suspended: 'Suspended',
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors, radius, spacing } = useTheme();

  const tone: { bg: string; fg: string } = (() => {
    switch (status) {
      case 'online':
      case 'completed':
        return { bg: colors.success + '22', fg: colors.success };
      case 'on_trip':
      case 'in_progress':
      case 'assigned':
      case 'driver_arrived':
      case 'paid':
        return { bg: colors.primary + '22', fg: colors.primary };
      case 'pending_payment':
        return { bg: colors.warning + '22', fg: colors.warning };
      case 'cancelled':
      case 'suspended':
        return { bg: colors.error + '22', fg: colors.error };
      case 'offline':
      default:
        return { bg: colors.border, fg: colors.textMuted };
    }
  })();

  return (
    <View
      style={{
        backgroundColor: tone.bg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radius.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="caption" style={{ color: tone.fg, fontWeight: '600' }}>
        {LABELS[status]}
      </Text>
    </View>
  );
}
