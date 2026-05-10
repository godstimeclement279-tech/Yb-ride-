import React from 'react';
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  onPress?: () => void;
  leading?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'filled' | 'outlined';
}

export function SearchBar({
  onPress,
  leading,
  placeholder = 'Search',
  containerStyle,
  value,
  variant = 'outlined',
  ...textInputProps
}: SearchBarProps) {
  const { colors, radius, spacing, typography } = useTheme();

  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: variant === 'filled' ? colors.surface : colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 52,
  };

  const leadingNode =
    leading ?? <Text variant="body" color="muted">⌕</Text>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[baseStyle, containerStyle]}>
        {leadingNode}
        <Text color={value ? 'text' : 'muted'} style={{ flex: 1 }}>
          {value || placeholder}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[baseStyle, containerStyle]}>
      {leadingNode}
      <TextInput
        {...textInputProps}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={{
          flex: 1,
          color: colors.text,
          ...typography.body,
          padding: 0,
        }}
      />
    </View>
  );
}
