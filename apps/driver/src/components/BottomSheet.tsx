import React, { type PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface BottomSheetProps {
  style?: StyleProp<ViewStyle>;
}

export function BottomSheet({
  children,
  style,
}: PropsWithChildren<BottomSheetProps>) {
  const { colors, radius, spacing, elevation } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          paddingTop: spacing.md,
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.lg,
          ...elevation.sheet,
        },
        style,
      ]}
    >
      <View
        style={{
          alignSelf: 'center',
          width: 36,
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
