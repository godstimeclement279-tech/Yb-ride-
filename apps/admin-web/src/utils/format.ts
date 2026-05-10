export {
  formatNaira,
  formatNairaExact,
  formatDistance,
  formatDuration,
  koboToNaira,
  nairaToKobo,
  KOBO_PER_NAIRA,
} from '@yb/shared';

const SHORT_DATE: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const FULL_DATE: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDate(ms?: number): string {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-NG', SHORT_DATE).format(new Date(ms));
}

export function formatDateTime(ms?: number): string {
  if (!ms) return '—';
  return new Intl.DateTimeFormat('en-NG', FULL_DATE).format(new Date(ms));
}

export function formatRelative(ms?: number): string {
  if (!ms) return '—';
  const diff = Date.now() - ms;
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (abs < min) return 'just now';
  if (abs < hour) return `${Math.floor(abs / min)}m ago`;
  if (abs < day) return `${Math.floor(abs / hour)}h ago`;
  if (abs < 30 * day) return `${Math.floor(abs / day)}d ago`;
  return formatDate(ms);
}
