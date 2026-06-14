import React, { type PropsWithChildren } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// One-time enable for LayoutAnimation on Android — iOS already supports it
// out of the box. Keeps the sheet collapse/expand smooth instead of
// snapping instantly when onToggle fires.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
      {/* Drag handle — tap toggles collapse if onToggle provided. Tap
          area is intentionally large (full sheet width + generous vertical
          padding) so users don't have to hit the 4px bar dead-on. */}
      <Pressable
        onPress={() => {
          if (!onToggle) return;
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        hitSlop={24}
        accessibilityRole={onToggle ? 'button' : undefined}
        accessibilityLabel={
          onToggle ? (collapsed ? 'Expand panel' : 'Collapse panel') : undefined
        }
        style={{
          alignSelf: 'stretch',
          alignItems: 'center',
          paddingVertical: spacing.md,
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            width: 48,
            height: 5,
            borderRadius: 3,
            backgroundColor: colors.border,
          }}
        />
      </Pressable>
      {children}
    </View>
  );
}
