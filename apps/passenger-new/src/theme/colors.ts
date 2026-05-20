// YB Ride brand palette — yellow + white identity.
//
// Brand spec:
//   Primary (CTA + brand) :  Yellow      #FACC15
//   Primary dim          :  Deeper yellow #EAB308
//   Primary soft tint    :  Pale yellow   #FEF9C3
//   Accent (rating, badge):  Same yellow as primary
//   Pickup pin           :  Green       #10B981
//   Dropoff pin          :  Rose        #F43F5E
//   Status success       :  Green       #10B981
//   Error                :  Red         #EF4444
//
// Visual language: bright white canvas, vibrant yellow primary CTAs with
// black labels, soft gray surfaces, dark text. Light + dark themes.

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

// Light: white canvas, yellow CTA, black text on yellow buttons.
export const lightPalette: ThemePalette = {
  primary: '#FACC15',
  primaryDim: '#EAB308',
  primarySoft: '#FEF9C3',
  accent: '#FACC15',
  accentSoft: '#FEF9C3',

  text: '#0A0A0A',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  // Buttons read textInverse for their label. Yellow primary needs black.
  textInverse: '#0A0A0A',

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
  mapDriverOnTrip: '#FACC15',
  mapDriverOffline: '#9CA3AF',
};

// Dark: near-black canvas, same yellow CTA, white body text.
export const darkPalette: ThemePalette = {
  primary: '#FACC15',
  primaryDim: '#FDE047',
  primarySoft: '#3F2E0A',
  accent: '#FDE047',
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
  warning: '#FDE047',
  info: '#60A5FA',

  pickup: '#34D399',
  dropoff: '#FB7185',

  shadow: 'rgba(0, 0, 0, 0.55)',
  overlay: 'rgba(0, 0, 0, 0.65)',

  mapDriverOnline: '#34D399',
  mapDriverOnTrip: '#FDE047',
  mapDriverOffline: '#6B7280',
};
