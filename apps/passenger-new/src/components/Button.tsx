import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

type Variant = 'primary' | 'dark' | 'brand' | 'secondary' | 'ghost' | 'danger' | 'success' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  rounded?: 'md' | 'pill';
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth = true,
  leading,
  trailing,
  rounded = 'md',
  disabled,
  ...rest
}: ButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const isDisabled = disabled || loading;

  const sizing = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base, minHeight: 40 },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 52 },
    lg: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl, minHeight: 60 },
  }[size];

  // primary = dark CTA per redesign (Reading B). Yellow is reserved for
  // brand accents (logo, splash, status pills) and never for buttons.
  // 'brand' kept as an escape hatch for the rare yellow-button case.
  const palette = {
    primary: { bg: colors.cta, text: colors.ctaText, border: colors.cta },
    dark: { bg: colors.cta, text: colors.ctaText, border: colors.cta },
    brand: { bg: colors.primary, text: colors.textInverse, border: colors.primary },
    secondary: { bg: colors.surface, text: colors.text, border: colors.surface },
    soft: { bg: colors.surface, text: colors.text, border: colors.surface },
    ghost: { bg: 'transparent', text: colors.text, border: 'transparent' },
    danger: { bg: colors.error, text: '#FFFFFF', border: colors.error },
    success: { bg: colors.success, text: '#FFFFFF', border: colors.success },
  }[variant];

  const radiusValue = rounded === 'pill' ? radius.pill : radius.md;

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
          borderRadius: radiusValue,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {leading}
          <Text variant="button" style={{ color: palette.text }}>{label}</Text>
          {trailing}
        </View>
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
