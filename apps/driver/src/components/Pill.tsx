import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  leading?: string;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'muted';
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, active, onPress, leading, tone = 'primary', style }: PillProps) {
  const { colors, radius, spacing } = useTheme();

  const toneColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    muted: colors.textMuted,
  }[tone];

  const base: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: active ? toneColor : colors.border,
    backgroundColor: active ? toneColor : colors.surface,
  };

  const content = (
    <>
      {leading && <Text style={{ color: active ? colors.textInverse : colors.text }}>{leading}</Text>}
      <Text variant="small" style={{ color: active ? colors.textInverse : colors.text }}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, { opacity: pressed ? 0.7 : 1 }, style]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{content}</View>;
}
