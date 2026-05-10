import React, { type PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface BottomSheetProps {
  style?: StyleProp<ViewStyle>;
  background?: 'card' | 'surface';
}

export function BottomSheet({
  children,
  style,
  background = 'surface',
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
      {/* Drag handle */}
      <View
        style={{
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: spacing.md,
        }}
      />
      {children}
    </View>
  );
}
