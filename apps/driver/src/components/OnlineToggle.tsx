import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface OnlineToggleProps {
  online: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function OnlineToggle({ online, onToggle, disabled }: OnlineToggleProps) {
  const { colors, radius, spacing } = useTheme();

  const bg = disabled
    ? colors.border
    : online
      ? colors.success
      : colors.surface;
  const fg = disabled
    ? colors.textMuted
    : online
      ? colors.textInverse
      : colors.text;

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: online ? colors.success : colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        opacity: pressed ? 0.85 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        alignSelf: 'flex-start',
      })}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: online ? colors.textInverse : colors.textMuted,
        }}
      />
      <Text variant="bodyStrong" style={{ color: fg }}>
        {online ? 'Online' : 'Go Online'}
      </Text>
    </Pressable>
  );
}
