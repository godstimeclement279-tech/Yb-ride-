import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
}

// Trip-history filter chip ("All Trips", "Business", "Personal", "Scheduled")
// — active state shows leading checkmark.
export function FilterChip({ label, active, onPress }: FilterChipProps) {
  const { colors, radius, spacing } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: active ? colors.text : colors.border,
        backgroundColor: active ? 'transparent' : colors.background,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {active && (
        <View>
          <Text variant="smallStrong">✓</Text>
        </View>
      )}
      <Text variant="smallStrong">{label}</Text>
    </Pressable>
  );
}
