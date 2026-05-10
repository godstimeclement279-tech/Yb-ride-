import React from 'react';
import { Pressable, View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface ListItemProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'card';
}

export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
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
          backgroundColor: variant === 'card' ? colors.card : 'transparent',
          borderRadius: variant === 'card' ? radius.md : 0,
        },
        style,
      ]}
    >
      {leading != null && (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {leading}
        </View>
      )}
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
