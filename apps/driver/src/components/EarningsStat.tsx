import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { formatNaira } from '@yb/shared';

interface EarningsStatProps {
  label: string;
  kobo?: number;
  count?: number;
  tone?: 'primary' | 'success' | 'accent';
}

export function EarningsStat({ label, kobo, count, tone = 'primary' }: EarningsStatProps) {
  const { colors, radius, spacing } = useTheme();

  const accentColor = {
    primary: colors.primary,
    success: colors.success,
    accent: colors.accent,
  }[tone];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.base,
        gap: spacing.xs,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
      }}
    >
      <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
      <Text variant="h2">
        {kobo != null ? formatNaira(kobo) : count != null ? String(count) : '—'}
      </Text>
    </View>
  );
}
