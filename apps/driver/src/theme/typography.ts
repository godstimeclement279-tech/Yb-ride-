import { Platform, type TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: undefined,
  android: 'sans-serif',
  default: undefined,
});

export const typography = {
  h1: { fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 34 } satisfies TextStyle,
  h2: { fontFamily, fontSize: 24, fontWeight: '700', lineHeight: 30 } satisfies TextStyle,
  h3: { fontFamily, fontSize: 18, fontWeight: '600', lineHeight: 24 } satisfies TextStyle,
  body: { fontFamily, fontSize: 16, fontWeight: '400', lineHeight: 22 } satisfies TextStyle,
  bodyStrong: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 22 } satisfies TextStyle,
  small: { fontFamily, fontSize: 14, fontWeight: '400', lineHeight: 20 } satisfies TextStyle,
  caption: { fontFamily, fontSize: 12, fontWeight: '400', lineHeight: 16 } satisfies TextStyle,
  button: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 20 } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
