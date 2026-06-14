import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface IconTileProps {
  size?: number;
  // 'soft' = the reference-style rounded-gray-square tile: surface bg, NO
  // border, dark icon. Use this for list-row leading icons.
  variant?: 'card' | 'surface' | 'soft' | 'dark' | 'primary' | 'transparent';
  rounded?: 'tile' | 'pill';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Square / pill icon container — used in list rows, profile sections,
// trip cards. Mirrors the rounded-square icon tiles in the reference UI.
export function IconTile({
  size = 44,
  variant = 'card',
  rounded = 'tile',
  children,
  style,
}: IconTileProps) {
  const { colors, radius } = useTheme();

  const bg = {
    card: colors.card,
    surface: colors.surface,
    soft: colors.surface,
    dark: colors.text,
    primary: colors.primary,
    transparent: 'transparent',
  }[variant];

  const borderColor =
    variant === 'card' ? colors.border : variant === 'surface' ? colors.border : 'transparent';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: rounded === 'pill' ? radius.pill : radius.tile,
          backgroundColor: bg,
          borderWidth: variant === 'card' || variant === 'surface' ? 1 : 0,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
