import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

type Tone = 'neutral' | 'success' | 'primary' | 'warning' | 'error' | 'dark';

interface BadgeProps {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

// Small inline badge — "FASTEST", "Promo Applied", "COMPLETED", "Valid 30d".
export function Badge({ label, tone = 'neutral', size = 'sm', style }: BadgeProps) {
  const { colors, radius, spacing } = useTheme();

  const palette = {
    neutral: { bg: colors.surface, fg: colors.text },
    success: { bg: colors.successSoft, fg: colors.success },
    primary: { bg: colors.primarySoft, fg: colors.primary },
    warning: { bg: colors.accentSoft, fg: colors.accent },
    error: { bg: colors.errorSoft, fg: colors.error },
    dark: { bg: colors.text, fg: colors.background },
  }[tone];

  const padV = size === 'md' ? spacing.xs + 2 : spacing.xs;
  const padH = size === 'md' ? spacing.sm + 2 : spacing.sm;

  return (
    <View
      style={[
        {
          backgroundColor: palette.bg,
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: radius.pill,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        variant={size === 'md' ? 'smallStrong' : 'caption'}
        style={{ color: palette.fg, fontWeight: '600' }}
      >
        {label}
      </Text>
    </View>
  );
}
