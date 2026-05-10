import { describe, expect, it } from 'vitest';
import {
  formatDistance,
  formatDuration,
  formatNaira,
  formatNairaExact,
  koboToNaira,
  nairaToKobo,
} from '../format';

describe('money', () => {
  it('converts naira ↔ kobo without drift', () => {
    expect(nairaToKobo(500)).toBe(50000);
    expect(nairaToKobo(1234.56)).toBe(123456);
    expect(koboToNaira(50000)).toBe(500);
  });

  it('formatNaira drops decimals by default', () => {
    expect(formatNaira(50000)).toContain('500');
    expect(formatNaira(50000)).not.toContain('.');
    // 123456 kobo = ₦1,234.56 → rounds to ₦1,235 with 0 fraction digits
    expect(formatNaira(123456)).toBe('₦1,235');
  });

  it('formatNairaExact preserves kobo as 2 decimals', () => {
    expect(formatNairaExact(123456)).toContain('1,234.56');
  });
});

describe('formatDistance', () => {
  it('shows meters for sub-1km values', () => {
    expect(formatDistance(0.4)).toBe('400 m');
  });

  it('shows km with one decimal otherwise', () => {
    expect(formatDistance(2.345)).toBe('2.3 km');
    expect(formatDistance(10)).toBe('10.0 km');
  });
});

describe('formatDuration', () => {
  it('handles sub-minute', () => {
    expect(formatDuration(0.5)).toBe('< 1 min');
  });

  it('handles minutes', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('handles hours', () => {
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(125)).toBe('2 hr 5 min');
  });
});
