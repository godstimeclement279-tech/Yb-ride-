import React from 'react';
import {
  Pressable,
  TextInput as RNTextInput,
  View,
  type TextInputProps as RNTextInputProps,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingPress?: () => void;
}

export function TextInput({
  label,
  error,
  leadingIcon,
  trailingIcon,
  onTrailingPress,
  ...rest
}: TextInputProps) {
  const { colors, radius, spacing, typography } = useTheme();

  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <Text variant="smallStrong">
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.base,
          minHeight: 56,
        }}
      >
        {leadingIcon && (
          <View style={{ marginRight: spacing.sm }}>{leadingIcon}</View>
        )}
        <RNTextInput
          {...rest}
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            color: colors.text,
            paddingVertical: spacing.md,
            // RNTextInput inherits some default outline on web; clear it.
            ...typography.body,
            ...({ outlineWidth: 0, outlineStyle: 'none' } as object),
          }}
        />
        {trailingIcon && (
          <Pressable
            onPress={onTrailingPress}
            hitSlop={10}
            style={{ marginLeft: spacing.sm, padding: 4 }}
          >
            {trailingIcon}
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="caption" color="error">
          {error}
        </Text>
      )}
    </View>
  );
}
