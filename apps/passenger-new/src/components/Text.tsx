import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { TypographyVariant } from '../theme/typography';

type ColorTone =
  | 'text'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'primary'
  | 'accent'
  | 'error'
  | 'success'
  | 'warning';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorTone;
}

export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const theme = useTheme();
  const tone: Record<ColorTone, string> = {
    text: theme.colors.text,
    muted: theme.colors.textMuted,
    subtle: theme.colors.textSubtle,
    inverse: theme.colors.textInverse,
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    error: theme.colors.error,
    success: theme.colors.success,
    warning: theme.colors.warning,
  };

  return <RNText {...rest} style={[theme.typography[variant], { color: tone[color] }, style]} />;
}
