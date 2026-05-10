// YB Ride brand palette — premium minimal aesthetic.
// Brand spec:
//   Primary CTA / brand: Deep Blue #1E3A8A
//   Accent / rating:     Gold      #F59E0B
//   Pickup pin:          Green     #10B981
//   Dropoff pin:         Rose      #F43F5E
//   Status success:      Green     #10B981
//   Error:               Red       #EF4444
// Visual language: bone-white canvas, soft gray surfaces, sharp typography,
// minimal shadows, brand-blue CTAs. Modeled after modern ride-hailing UIs.

export interface ThemePalette {
  // brand
  primary: string;
  primaryDim: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;

  // text
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  // surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  card: string;

  // borders / lines
  border: string;
  borderStrong: string;
  divider: string;

  // status
  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  warning: string;
  info: string;

  // pins
  pickup: string;
  dropoff: string;

  // utility
  shadow: string;
  overlay: string;

  // map states
  mapDriverOnline: string;
  mapDriverOnTrip: string;
  mapDriverOffline: string;
}

export const lightPalette: ThemePalette = {
  primary: '#1E3A8A',
  primaryDim: '#3151B0',
  primarySoft: '#E8EEFF',
  accent: '#F59E0B',
  accentSoft: '#FEF3C7',

  text: '#0A0A0A',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  textInverse: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#F5F5F7',
  surfaceMuted: '#FAFAFB',
  card: '#FFFFFF',

  border: '#E8E8EC',
  borderStrong: '#0A0A0A',
  divider: '#EFEFF1',

  success: '#10B981',
  successSoft: '#D1FAE5',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  warning: '#F59E0B',
  info: '#3B82F6',

  pickup: '#10B981',
  dropoff: '#F43F5E',

  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.45)',

  mapDriverOnline: '#10B981',
  mapDriverOnTrip: '#1E3A8A',
  mapDriverOffline: '#9CA3AF',
};

export const darkPalette: ThemePalette = {
  primary: '#3B5BCA',
  primaryDim: '#1E3A8A',
  primarySoft: '#1E2A55',
  accent: '#FBBF24',
  accentSoft: '#3F2E0A',

  text: '#F5F5F7',
  textMuted: '#9CA3AF',
  textSubtle: '#6B7280',
  textInverse: '#0A0A0A',

  background: '#0B0B0F',
  surface: '#16161B',
  surfaceMuted: '#101015',
  card: '#1A1A20',

  border: '#26262E',
  borderStrong: '#F5F5F7',
  divider: '#1F1F26',

  success: '#34D399',
  successSoft: '#0F3D2E',
  error: '#F87171',
  errorSoft: '#3D1A1A',
  warning: '#FBBF24',
  info: '#60A5FA',

  pickup: '#34D399',
  dropoff: '#FB7185',

  shadow: 'rgba(0, 0, 0, 0.55)',
  overlay: 'rgba(0, 0, 0, 0.65)',

  mapDriverOnline: '#34D399',
  mapDriverOnTrip: '#3B5BCA',
  mapDriverOffline: '#6B7280',
};
