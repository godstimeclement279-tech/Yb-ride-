import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface HeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  trailing?: React.ReactNode;
  onBackPress?: () => void;
}

// Inline header used on flat screens that don't use the native stack header.
// Back arrow + title (+ subtitle) + trailing slot.
export function Header({ title, subtitle, back, trailing, onBackPress }: HeaderProps) {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      {back && (
        <Pressable
          onPress={onBackPress ?? (() => navigation.goBack())}
          hitSlop={10}
          style={{ paddingRight: spacing.xs }}
        >
          <Text variant="h3">‹</Text>
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="h3">{title}</Text>
        {subtitle && (
          <Text variant="small" color="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
    </View>
  );
}
