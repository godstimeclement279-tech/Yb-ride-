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
  accent: '#FACC15',

  text: '#1F2937',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#F9FAFB',
  card: '#FFFFFF',

  border: '#E5E7EB',
  divider: '#F3F4F6',

  success: '#10B981',
  error: '#EF4444',
  warning: '#FACC15',
  info: '#3B82F6',

  shadow: 'rgba(0, 0, 0, 0.10)',
  overlay: 'rgba(0, 0, 0, 0.35)',

  mapDriverOnline: '#10B981',
  mapDriverOnTrip: '#1E3A8A',
  mapDriverOffline: '#9CA3AF',
};

// YB Brand dark mode: navy canvas, yellow CTA, white text.
export const darkPalette: ThemePalette = {
  primary: '#FDE047',
  primaryDim: '#FACC15',
  accent: '#FDE047',

  text: '#FFFFFF',
  textMuted: '#C7D2E8',
  textInverse: '#1E3A8A',

  background: '#1E3A8A',
  surface: '#2A4AA0',
  card: '#34529F',

  border: '#3E5BAD',
  divider: '#2A4AA0',

  success: '#34D399',
  error: '#FCA5A5',
  warning: '#FDE047',
  info: '#93C5FD',

  shadow: 'rgba(0, 0, 0, 0.40)',
  overlay: 'rgba(15, 23, 70, 0.7)',

  mapDriverOnline: '#34D399',
  mapDriverOnTrip: '#FB923C',
  mapDriverOffline: '#93A5C7',
};
