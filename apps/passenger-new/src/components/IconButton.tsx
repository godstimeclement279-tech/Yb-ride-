import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface IconButtonProps {
  onPress: () => void;
  glyph: string;
  size?: number;
  variant?: 'card' | 'surface' | 'dark' | 'transparent';
  accessibilityLabel?: string;
}

// Floating circular button — used for back/menu/notification/recenter on map.
export function IconButton({
  onPress,
  glyph,
  size = 44,
  variant = 'card',
  accessibilityLabel,
}: IconButtonProps) {
  const { colors, elevation } = useTheme();

  const bg = {
    card: colors.card,
    surface: colors.surface,
    dark: colors.text,
    transparent: 'transparent',
  }[variant];

  const fg = variant === 'dark' ? colors.background : colors.text;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
        ...(variant === 'card' ? elevation.sm : {}),
      })}
    >
      <Text style={{ color: fg, fontSize: 18 }}>{glyph}</Text>
    </Pressable>
  );
}
