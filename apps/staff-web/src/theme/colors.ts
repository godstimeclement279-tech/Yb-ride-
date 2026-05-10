// YB Ride brand palette — mirror admin-web for visual parity.

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

  mapDriverOnline: string;
  mapDriverOnTrip: string;
  mapDriverOffline: string;
}

export const lightPalette: ThemePalette = {
  primary: '#1E3A8A',
  primaryDim: '#3151B0',
  accent: '#F59E0B',

  text: '#1F2937',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  border: '#E5E7EB',
  divider: '#F3F4F6',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  shadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.35)',

  mapDriverOnline: '#10B981',
  mapDriverOnTrip: '#1E3A8A',
  mapDriverOffline: '#9CA3AF',
};

export const darkPalette: ThemePalette = {
  primary: '#3B5BCA',
  primaryDim: '#1E3A8A',
  accent: '#FBBF24',

  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textInverse: '#0B1020',

  background: '#0B1020',
  surface: '#111827',
  card: '#1F2937',

  border: '#374151',
  divider: '#1F2937',

  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',

  shadow: 'rgba(0, 0, 0, 0.40)',
  overlay: 'rgba(0, 0, 0, 0.55)',

  mapDriverOnline: '#34D399',
  mapDriverOnTrip: '#3B5BCA',
  mapDriverOffline: '#6B7280',
};
