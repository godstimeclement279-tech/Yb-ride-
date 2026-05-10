import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { TypographyVariant } from '../theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: 'text' | 'muted' | 'inverse' | 'primary' | 'accent' | 'error' | 'success' | 'warning';
}

export function Text({
  variant = 'body',
  color = 'text',
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const tone = {
    text: theme.colors.text,
    muted: theme.colors.textMuted,
    inverse: theme.colors.textInverse,
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
  }[color];

  return (
    <RNText
      {...rest}
      style={[theme.typography[variant], { color: tone }, style]}
    />
  );
}
