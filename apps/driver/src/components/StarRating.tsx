import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface StarRatingProps {
  value: number;
  onChange?: (stars: 1 | 2 | 3 | 4 | 5) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 28 }: StarRatingProps) {
  const { colors, spacing } = useTheme();
  const stars: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {stars.map(s => {
        const filled = s <= value;
        const inner = (
          <Text style={{ fontSize: size, color: filled ? colors.accent : colors.border }}>
            {filled ? '★' : '☆'}
          </Text>
        );
        return onChange ? (
          <Pressable key={s} onPress={() => onChange(s)} hitSlop={6}>
            {inner}
          </Pressable>
        ) : (
          <View key={s}>{inner}</View>
        );
      })}
    </View>
  );
}
