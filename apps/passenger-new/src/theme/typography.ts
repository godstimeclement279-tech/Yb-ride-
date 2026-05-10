import { Platform, type TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: undefined,            // SF Pro
  android: 'sans-serif',     // Roboto
  default: undefined,
});

const fontFamilyMedium = Platform.select({
  ios: undefined,
  android: 'sans-serif-medium',
  default: undefined,
});

export const typography = {
  display: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  h2: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  h3: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  } satisfies TextStyle,
  h4: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,
  small: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } satisfies TextStyle,
  smallStrong: {
    fontFamily: fontFamilyMedium,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } satisfies TextStyle,
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } satisfies TextStyle,
  overline: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.1,
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
