import React, { type PropsWithChildren } from 'react';
import { View, ScrollView, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface ScreenProps {
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
  fullBleed?: boolean;
}

export function Screen({
  children,
  scroll,
  edges = ['top', 'bottom'],
  contentStyle,
  fullBleed,
}: PropsWithChildren<ScreenProps>) {
  const { colors, spacing } = useTheme();

  const padding = fullBleed ? 0 : spacing.base;

  if (scroll) {
    return (
      <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={[{ padding, gap: spacing.base }, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[{ flex: 1, padding }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}
