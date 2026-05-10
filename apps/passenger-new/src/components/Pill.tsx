import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface PillProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  leading?: React.ReactNode;
  variant?: 'outlined' | 'filled';
  style?: StyleProp<ViewStyle>;
}

export function Pill({
  label,
  active,
  onPress,
  leading,
  variant = 'outlined',
  style,
}: PillProps) {
  const { colors, radius, spacing } = useTheme();

  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: active ? colors.text : colors.border,
    backgroundColor: active
      ? variant === 'filled'
        ? colors.text
        : colors.background
      : colors.surface,
  };

  const fg = active ? (variant === 'filled' ? colors.background : colors.text) : colors.text;

  const content = (
    <>
      {leading}
      <Text variant="smallStrong" style={{ color: fg }}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, { opacity: pressed ? 0.7 : 1 }, style]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[baseStyle, style]}>{content}</View>;
}
