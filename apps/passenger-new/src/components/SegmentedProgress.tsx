import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type ProgressStep = {
  key: string;
  label: string;
};

interface SegmentedProgressProps {
  steps: ProgressStep[];
  currentIndex: number;
}

// Three-stop tracker shown at top of TripTracking ("Pickup | En Route | Drop-off").
// Active stop is bold + filled dot; inactive stops are muted + outlined dots.
export function SegmentedProgress({ steps, currentIndex }: SegmentedProgressProps) {
  const { colors, radius, spacing, elevation } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        ...elevation.sm,
      }}
    >
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const dotColor = isActive ? colors.success : isDone ? colors.primary : colors.border;
        const fg = isActive ? colors.text : colors.textMuted;
        return (
          <React.Fragment key={step.key}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.xs,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isActive || isDone ? dotColor : 'transparent',
                  borderWidth: isActive || isDone ? 0 : 1.5,
                  borderColor: dotColor,
                }}
              />
              <Text variant="smallStrong" style={{ color: fg }}>
                {step.label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View
                style={{
                  width: 1,
                  height: 14,
                  backgroundColor: colors.border,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
