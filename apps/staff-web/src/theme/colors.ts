// YB Ride staff dashboard — Stripe-leaning SaaS palette.
//
// Why this palette instead of pure black-on-white: Stripe's dashboard is the
// canonical reference for "premium operational tool" — warm off-white
// surfaces, a signature deep blue-ink (#0A2540) as text + primary CTA, a
// pale blue-grey surface (#F6F9FC) for cards/sidebars, subtle borders.
// Reads as confident and editorial without being trendy. Brand YB yellow
// stays as accent for status pills, promo badges, on-call indicators.
//
// Mirror this file into admin-web/src/theme/colors.ts to keep both
// dashboards visually identical.

export interface ThemePalette {
  primary: string;
  primaryDim: string;
  accent: string;
  brand: string;       // YB yellow — accent for badges/promos
  brandSoft: string;   // pale yellow surface for promo cards

  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  background: string;
  surface: string;     // softer page bg (off-white blue tint)
  card: string;        // white card on top of surface
  cardElevated: string; // for floating modals / dropdowns

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

  shadow: string;       // base shadow color (rgba)
  shadowSoft: string;   // small subtle shadow
  shadowMd: string;     // dropdown / popover
  shadowLg: string;     // modal / focus card
  overlay: string;      // modal backdrop

  mapDriverOnline: string;
  mapDriverOnTrip: string;
  mapDriverOffline: string;
}

// Light = primary; Stripe dashboard is light-mode by default.
export const lightPalette: ThemePalette = {
  // Primary CTA + text — Stripe's signature deep blue-ink
  primary: '#0A2540',
  primaryDim: '#1A3A5C',
  accent: '#0A2540',
  brand: '#FACC15',
  brandSoft: '#FEF9C3',

  text: '#0A2540',
  textMuted: '#525F7F',
  textSubtle: '#8898AA',
  textInverse: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#F6F9FC',     // signature pale blue-grey
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  border: '#E3E8EE',
  borderStrong: '#0A2540',
  divider: '#E6EBF1',

  // Stripe's status palette
  success: '#3ECE80',
  successSoft: '#E3F9E5',
  error: '#E25950',
  errorSoft: '#FDE7E5',
  warning: '#F5BE58',
  warningSoft: '#FEF5DC',
  info: '#3D7EFF',
  infoSoft: '#E3EBFE',

  // Stripe's signature multi-stop shadow — two soft layers stacked for depth
  shadow: 'rgba(50, 50, 93, 0.1)',
  shadowSoft: '0 1px 3px rgba(50,50,93,0.05), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 8px rgba(50,50,93,0.08), 0 2px 5px rgba(0,0,0,0.05)',
  shadowLg: '0 13px 27px -5px rgba(50,50,93,0.12), 0 8px 16px -8px rgba(0,0,0,0.18)',
  overlay: 'rgba(10, 37, 64, 0.5)',

  mapDriverOnline: '#3ECE80',
  mapDriverOnTrip: '#FACC15',
  mapDriverOffline: '#8898AA',
};

// Dark = secondary; deep blue-charcoal canvas, lighter ink text.
export const darkPalette: ThemePalette = {
  primary: '#FFFFFF',
  primaryDim: '#E3E8EE',
  accent: '#FFFFFF',
  brand: '#FACC15',
  brandSoft: '#3F2E0A',

  text: '#F0F4F8',
  textMuted: '#8898AA',
  textSubtle: '#697386',
  textInverse: '#0A2540',

  background: '#0A1929',
  surface: '#0F2236',
  card: '#152A40',
  cardElevated: '#1B3450',

  border: '#1F3A56',
  borderStrong: '#F0F4F8',
  divider: '#1F3A56',

  success: '#3ECE80',
  successSoft: '#0E3D24',
  error: '#F87171',
  errorSoft: '#3D1A1A',
  warning: '#F5BE58',
  warningSoft: '#3F2E0A',
  info: '#60A5FA',
  infoSoft: '#1A2F4D',

  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowSoft: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  shadowMd: '0 4px 8px rgba(0,0,0,0.45)',
  shadowLg: '0 13px 27px -5px rgba(0,0,0,0.5), 0 8px 16px -8px rgba(0,0,0,0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  mapDriverOnline: '#3ECE80',
  mapDriverOnTrip: '#FACC15',
  mapDriverOffline: '#8898AA',
};
