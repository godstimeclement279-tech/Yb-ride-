import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, ...rest }: TextInputProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <Text variant="small" color="muted">
          {label}
        </Text>
      )}
      <RNTextInput
        {...rest}
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          color: colors.text,
          minHeight: 52,
          ...typography.body,
        }}
      />
      {error && (
        <Text variant="caption" color="error">
          {error}
        </Text>
      )}
    </View>
  );
}
