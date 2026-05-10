import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface DividerProps {
  inset?: number;
  vertical?: boolean;
}

export function Divider({ inset = 0, vertical }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: colors.divider, marginVertical: inset }
          : { height: 1, backgroundColor: colors.divider, marginLeft: inset }
      }
    />
  );
}
