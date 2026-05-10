export const KOBO_PER_NAIRA = 100;

export function nairaToKobo(naira: number): number {
  return Math.round(naira * KOBO_PER_NAIRA);
}

export function koboToNaira(kobo: number): number {
  return kobo / KOBO_PER_NAIRA;
}

// Default whole-naira display: ₦1,250
export function formatNaira(kobo: number): string {
  const naira = kobo / KOBO_PER_NAIRA;
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

// For precise display where kobo matter (rare): ₦1,250.50
export function formatNairaExact(kobo: number): string {
  const naira = kobo / KOBO_PER_NAIRA;
  return `₦${naira.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
