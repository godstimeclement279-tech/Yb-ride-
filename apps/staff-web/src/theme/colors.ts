// YB Ride staff dashboard — yellow + white brand SaaS palette.
//
// Brand is yellow + white. Keep all Stripe-style component primitives
// (cards, multi-stop shadows, pill statuses, KPI tiles, table density),
// but the palette is yellow primary + warm off-white surfaces + near-black
// text. Yellow IS the brand, so primary CTAs use it and put dark text
// inside the button (yellow + white text = unreadable).
//
// Mirror this file into admin-web/src/theme/colors.ts to keep both
// dashboards visually identical.

export interface ThemePalette {
  primary: string;
  primaryDim: string;
  accent: string;
  brand: string;       // alias of primary — kept for component compat
  brandSoft: string;   // pale yellow soft surface for promo cards

  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;  // sits INSIDE primary (yellow) button → must be dark

  background: string;
  surface: string;     // warm off-white page bg with slight yellow tint
  card: string;
  cardElevated: string;

  border: string;
  borderStrong: string;
  divider: string;

  success: string;
  successSoft: string;
  error: string;
  errorSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;

  shadow: string;
  shadowSoft: string;
  shadowMd: string;
  shadowLg: string;
  overlay: string;

  mapDriverOnline: string;
  mapDriverOnTrip: string;
  mapDriverOffline: string;
}

export const lightPalette: ThemePalette = {
  // Brand yellow as primary CTA, slightly darker for hover.
  primary: '#FACC15',
  primaryDim: '#EAB308',
  accent: '#FACC15',
  brand: '#FACC15',
  brandSoft: '#FEF9C3',

  // Near-black text for legibility on white + on yellow buttons.
  text: '#0A0A0A',
  textMuted: '#525B6E',
  textSubtle: '#9CA3AF',
  textInverse: '#0A0A0A',  // dark text inside yellow buttons

  background: '#FFFFFF',
  surface: '#FAFAF7',      // warm off-white, very subtle yellow tint
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  border: '#E5E7EB',
  borderStrong: '#0A0A0A',
  divider: '#F1F2F4',

  success: '#10B981',
  successSoft: '#D1FAE5',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  warning: '#F59E0B',      // amber, distinct from brand yellow
  warningSoft: '#FEF3C7',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',

  // Warm-grey multi-stop shadows.
  shadow: 'rgba(31, 41, 55, 0.1)',
  shadowSoft: '0 1px 3px rgba(31,41,55,0.05), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 8px rgba(31,41,55,0.08), 0 2px 5px rgba(0,0,0,0.05)',
  shadowLg: '0 13px 27px -5px rgba(31,41,55,0.12), 0 8px 16px -8px rgba(0,0,0,0.18)',
  overlay: 'rgba(10, 10, 10, 0.5)',

  mapDriverOnline: '#10B981',
  mapDriverOnTrip: '#FACC15',
  mapDriverOffline: '#9CA3AF',
};

export const darkPalette: ThemePalette = {
  primary: '#FACC15',
  primaryDim: '#EAB308',
  accent: '#FACC15',
  brand: '#FACC15',
  brandSoft: '#3F2E0A',

  text: '#F5F5F4',
  textMuted: '#A8B0B8',
  textSubtle: '#6B7280',
  textInverse: '#0A0A0A',  // dark text inside yellow buttons (same in dark mode)

  background: '#0A0A0A',
  surface: '#141414',
  card: '#1A1A1A',
  cardElevated: '#222222',

  border: '#2A2A2A',
  borderStrong: '#F5F5F4',
  divider: '#2A2A2A',

  success: '#10B981',
  successSoft: '#0E3D24',
  error: '#F87171',
  errorSoft: '#3D1A1A',
  warning: '#F59E0B',
  warningSoft: '#3F2E0A',
  info: '#60A5FA',
  infoSoft: '#1A2F4D',

  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowSoft: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  shadowMd: '0 4px 8px rgba(0,0,0,0.45)',
  shadowLg: '0 13px 27px -5px rgba(0,0,0,0.5), 0 8px 16px -8px rgba(0,0,0,0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  mapDriverOnline: '#10B981',
  mapDriverOnTrip: '#FACC15',
  mapDriverOffline: '#6B7280',
};
