// YB Ride brand palette — yellow + white identity, mirrors the mobile apps.
// Primary Yellow #FACC15, dim #EAB308. Button labels read textInverse (black).

export interface ThemePalette {
  primary: string;
  primaryDim: string;
  accent: string;

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

  shadow: string;
  overlay: string;
}

export const lightPalette: ThemePalette = {
  primary: '#FACC15',
  primaryDim: '#EAB308',
  accent: '#FACC15',

  text: '#0A0A0A',
  textMuted: '#6B7280',
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

  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.45)',
};

export const darkPalette: ThemePalette = {
  primary: '#FACC15',
  primaryDim: '#FDE047',
  accent: '#FDE047',

  text: '#F5F5F7',
  textMuted: '#9CA3AF',
  textInverse: '#0A0A0A',

  background: '#0B0B0F',
  surface: '#16161B',
  card: '#1A1A20',

  border: '#26262E',
  divider: '#1F1F26',

  success: '#34D399',
  error: '#F87171',
  warning: '#FDE047',
  info: '#60A5FA',

  shadow: 'rgba(0, 0, 0, 0.55)',
  overlay: 'rgba(0, 0, 0, 0.65)',
};
