import React, { type PropsWithChildren } from 'react';
import { Pressable, View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface CardProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'outlined' | 'soft';
  padded?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

export function Card({
  children,
  style,
  variant = 'soft',
  padded = true,
  selected,
  onPress,
}: PropsWithChildren<CardProps>) {
  const { colors, radius, spacing, elevation } = useTheme();

  const variantStyle: ViewStyle =
    variant === 'elevated'
      ? { ...elevation.sm, backgroundColor: colors.card }
      : variant === 'outlined'
        ? { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }
        : variant === 'soft'
          ? { backgroundColor: colors.surface }
          : { backgroundColor: colors.card };

  // Selected outline uses the CTA colour (dark) per redesign — dark borders
  // read as confident / premium in the reference. Yellow is reserved for
  // brand accents.
  const selectedStyle: ViewStyle = selected
    ? { borderWidth: 1.5, borderColor: colors.cta, backgroundColor: colors.card }
    : {};

  const containerStyle: ViewStyle = {
    borderRadius: radius.card,
    padding: padded ? spacing.base : 0,
    ...variantStyle,
    ...selectedStyle,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [containerStyle, { opacity: pressed ? 0.92 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
}
