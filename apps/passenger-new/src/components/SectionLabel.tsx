import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface SectionLabelProps {
  label: string;
  trailing?: React.ReactNode;
}

// Uppercase tracker label above a list group ("ACCOUNT", "FAVORITES",
// "RECENT", "PREVIOUS_MONTH"). Optional trailing slot for "Edit" button etc.
export function SectionLabel({ label, trailing }: SectionLabelProps) {
  const { spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      <Text variant="overline" color="muted">
        {label}
      </Text>
      {trailing}
    </View>
  );
}
