import React, { type PropsWithChildren } from 'react';
import { View, ScrollView, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

interface ScreenProps {
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentStyle?: StyleProp<ViewStyle>;
  fullBleed?: boolean;
  background?: 'background' | 'surface';
}

export function Screen({
  children,
  scroll,
  edges = ['top', 'bottom'],
  contentStyle,
  fullBleed,
  background = 'background',
}: PropsWithChildren<ScreenProps>) {
  const { colors, spacing } = useTheme();
  const padding = fullBleed ? 0 : spacing.base;
  const bg = background === 'surface' ? colors.surface : colors.background;

  if (scroll) {
    return (
      <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
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
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: bg }}>
      <View style={[{ flex: 1, padding }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}
