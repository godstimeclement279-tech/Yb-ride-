// YB Ride brand palette (light + dark). Money-precision unrelated; pure visual.
// Brand spec:
//   Primary: Deep Blue #1E3A8A
//   Accent:  Gold      #FACC15
//   Success: Green     #10B981
//   Error:   Red       #EF4444

export interface ThemePalette {
  primary: string;
  primaryDim: string;
  accent: string;

  // Premium CTA layer — dark in light theme, light in dark theme. Brand
  // (yellow) stays as accent (badges, status pills, brand splash). Mirrors
  // the passenger theme so the two apps feel like one product family.
  cta: string;
  ctaText: string;

  text: string;
  textMuted: string;
  textInverse: string;

  background: string;
  surface: string;
  card: string;

  border: string;
  divider: string;

  success: string;
  error: string;
  warning: string;
  info: string;

  // Trip pin colors — green pickup, rose dropoff.
  pickup: string;
  dropoff: string;

  shadow: string;
  overlay: string;

  mapDriverOnline: string;
  mapDriverOnTrip: string;
  mapDriverOffline: string;
}

// Light: white canvas, vibrant yellow CTA, black labels on yellow buttons.
export const lightPalette: ThemePalette = {
  primary: '#FACC15',
  primaryDim: '#EAB308',
  accent: '#FACC15',

  // Dark CTA + white label — premium contrast on white canvas.
  cta: '#0A0A0A',
  ctaText: '#FFFFFF',

  text: '#0A0A0A',
  textMuted: '#6B7280',
  // Buttons read textInverse for their label — yellow primary needs black.
  textInverse: '#0A0A0A',

  background: '#FFFFFF',
  surface: '#F5F5F7',
  card: '#FFFFFF',

  border: '#E8E8EC',
  divider: '#EFEFF1',

  success: '#10B981',
  error: '#EF4444',
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
  accent: '#FDE047',

  // Dark theme: CTA flips to white-on-dark for the same premium contrast.
  cta: '#F5F5F7',
  ctaText: '#0A0A0A',

  text: '#F5F5F7',
  textMuted: '#9CA3AF',
  textInverse: '#0A0A0A',

  background: '#0B0B0F',
  surface: '#16161B',
  card: '#1A1A20',

  border: '#26262E',
  divider: '#1F1F26',

  success: '#34D399',
  error: '#FCA5A5',
  warning: '#FDE047',
  info: '#93C5FD',

  pickup: '#34D399',
  dropoff: '#FB7185',

  shadow: 'rgba(0, 0, 0, 0.55)',
  overlay: 'rgba(0, 0, 0, 0.65)',

  mapDriverOnline: '#34D399',
  mapDriverOnTrip: '#FDE047',
  mapDriverOffline: '#6B7280',
};
