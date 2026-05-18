// YB Ride brand palette — premium minimal aesthetic.
// Brand spec:
//   Primary CTA / brand: Deep Blue #1E3A8A
//   Accent / rating:     Gold      #FACC15
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
  accent: '#FACC15',
  accentSoft: '#FEF9C3',

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
  warning: '#FACC15',
  info: '#3B82F6',

  pickup: '#10B981',
  dropoff: '#F43F5E',

  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.45)',

  mapDriverOnline: '#10B981',
  mapDriverOnTrip: '#1E3A8A',
  mapDriverOffline: '#9CA3AF',
};

// YB Brand dark mode: navy canvas, yellow CTA, white text.
export const darkPalette: ThemePalette = {
  primary: '#FDE047',
  primaryDim: '#FACC15',
  primarySoft: '#3D52A8',
  accent: '#FDE047',
  accentSoft: '#2A3F88',

  text: '#FFFFFF',
  textMuted: '#C7D2E8',
  textSubtle: '#93A5C7',
  textInverse: '#1E3A8A',

  background: '#1E3A8A',
  surface: '#2A4AA0',
  surfaceMuted: '#1A3478',
  card: '#34529F',

  border: '#3E5BAD',
  borderStrong: '#FDE047',
  divider: '#2A4AA0',

  success: '#34D399',
  successSoft: '#1E4F3C',
  error: '#FCA5A5',
  errorSoft: '#7F1D1D',
  warning: '#FDE047',
  info: '#93C5FD',

  pickup: '#34D399',
  dropoff: '#FB7185',

  shadow: 'rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(15, 23, 70, 0.7)',

  mapDriverOnline: '#34D399',
  mapDriverOnTrip: '#FB923C',
  mapDriverOffline: '#93A5C7',
};
