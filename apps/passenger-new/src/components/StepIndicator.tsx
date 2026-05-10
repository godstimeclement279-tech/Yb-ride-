import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface StepIndicatorProps {
  steps: string[];
  currentIndex: number;
}

// "1 Summary — 2 Payment — 3 Confirm" stepper for checkout flow.
export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        gap: spacing.sm,
      }}
    >
      {steps.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const filled = isActive || isDone;
        return (
          <React.Fragment key={step}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: filled ? colors.text : colors.background,
                  borderWidth: 1,
                  borderColor: filled ? colors.text : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  variant="smallStrong"
                  style={{ color: filled ? colors.background : colors.textMuted }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                variant="smallStrong"
                style={{ color: isActive ? colors.text : colors.textMuted }}
              >
                {step}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
