import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

interface AvatarProps {
  name: string;
  size?: number;
  online?: boolean;
  // Public photo URL (e.g. from Firebase Storage). When provided + non-empty
  // the image is shown instead of the initials. Falsy values fall back to
  // the brand-yellow initial-letter chip.
  uri?: string | null;
}

export function Avatar({ name, size = 64, online, uri }: AvatarProps) {
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
          overflow: 'hidden',
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ color: colors.textInverse, fontSize: size * 0.42, fontWeight: '700' }}>
            {initial}
          </Text>
        )}
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
