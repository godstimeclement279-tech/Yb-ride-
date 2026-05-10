import React, { type PropsWithChildren } from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'outlined';
  padded?: boolean;
}

export function Card({
  children,
  style,
  variant = 'elevated',
  padded = true,
}: PropsWithChildren<CardProps>) {
  const { colors, radius, spacing, elevation } = useTheme();

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { ...elevation.md }
      : variant === 'outlined'
        ? { borderWidth: 1, borderColor: colors.border }
        : {};

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: padded ? spacing.base : 0,
        },
        variantStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
