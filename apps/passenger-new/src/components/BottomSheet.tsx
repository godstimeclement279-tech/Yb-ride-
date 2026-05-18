import React, { type PropsWithChildren } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface BottomSheetProps {
  style?: StyleProp<ViewStyle>;
  background?: 'card' | 'surface';
  /** Tap the drag handle to call this. When provided, handle gets a tap-feedback. */
  onToggle?: () => void;
  collapsed?: boolean;
}

export function BottomSheet({
  children,
  style,
  background = 'surface',
  onToggle,
  collapsed,
}: PropsWithChildren<BottomSheetProps>) {
  const { colors, radius, spacing, elevation } = useTheme();

  const bg = background === 'card' ? colors.card : colors.surface;

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.lg,
          ...elevation.sheet,
        },
        style,
      ]}
    >
      {/* Drag handle — tap toggles collapse if onToggle provided */}
      <Pressable
        onPress={onToggle}
        hitSlop={16}
        accessibilityRole={onToggle ? 'button' : undefined}
        accessibilityLabel={
          onToggle ? (collapsed ? 'Expand panel' : 'Collapse panel') : undefined
        }
        style={{
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingVertical: spacing.xs,
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border,
          }}
        />
      </Pressable>
      {children}
    </View>
  );
}
