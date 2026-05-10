import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface AvatarProps {
  name: string;
  size?: number;
  online?: boolean;
}

// Initial avatar (no real photos in mock). Optional online-dot accent.
export function Avatar({ name, size = 64, online }: AvatarProps) {
  const { colors } = useTheme();
  const initial = name.charAt(0).toUpperCase();

  return (
    <View>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.textInverse, fontSize: size * 0.42, fontWeight: '700' }}>
          {initial}
        </Text>
      </View>
      {online && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            backgroundColor: colors.success,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        />
      )}
    </View>
  );
}
