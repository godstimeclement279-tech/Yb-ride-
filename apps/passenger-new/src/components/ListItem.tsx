import React from 'react';
import { Pressable, View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface ListItemProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'card';
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  showChevron,
  onPress,
  style,
  variant = 'default',
}: ListItemProps) {
  const { colors, spacing, radius } = useTheme();

  const inner = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: variant === 'card' ? spacing.base : 0,
          backgroundColor: variant === 'card' ? colors.surface : 'transparent',
          borderRadius: variant === 'card' ? radius.md : 0,
        },
        style,
      ]}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle != null && (
          <Text variant="small" color="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing}
      {showChevron && (
        <Text variant="body" color="subtle">
          ›
        </Text>
      )}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.divider }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {inner}
    </Pressable>
  );
}
