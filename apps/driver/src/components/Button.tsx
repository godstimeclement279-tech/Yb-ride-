import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

type Variant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'danger' | 'success' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth = true,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const sizing = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base, minHeight: 36 },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 48 },
    lg: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl, minHeight: 56 },
  }[size];

  const palette = {
    // primary = dark CTA (premium contrast); brand = yellow (kept for rare
    // on-brand moments like "Go Online"). Mirrors passenger app.
    primary: { bg: colors.cta, text: colors.ctaText, border: colors.cta },
    brand: { bg: colors.primary, text: colors.textInverse, border: colors.primary },
    secondary: { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', text: colors.text, border: 'transparent' },
    danger: { bg: colors.error, text: colors.textInverse, border: colors.error },
    success: { bg: colors.success, text: colors.textInverse, border: colors.success },
    accent: { bg: colors.accent, text: colors.textInverse, border: colors.accent },
  }[variant];

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizing,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text variant="button" style={{ color: palette.text }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
