import { describe, expect, it } from 'vitest';
import { isPointInPolygon } from '../pricing/geometry';

describe('isPointInPolygon', () => {
  // Square around Agbor central
  const square = [
    { latitude: 6.24, longitude: 6.19 },
    { latitude: 6.26, longitude: 6.19 },
    { latitude: 6.26, longitude: 6.20 },
    { latitude: 6.24, longitude: 6.20 },
  ];

  it('returns true for a point clearly inside', () => {
    expect(isPointInPolygon({ latitude: 6.25, longitude: 6.195 }, square)).toBe(true);
  });

  it('returns false for a point clearly outside', () => {
    expect(isPointInPolygon({ latitude: 6.30, longitude: 6.30 }, square)).toBe(false);
  });

  it('returns false for a degenerate polygon (< 3 points)', () => {
    expect(isPointInPolygon({ latitude: 6.25, longitude: 6.195 }, [])).toBe(false);
    expect(
      isPointInPolygon({ latitude: 6.25, longitude: 6.195 }, [
        { latitude: 6.24, longitude: 6.19 },
        { latitude: 6.26, longitude: 6.19 },
      ]),
    ).toBe(false);
  });

  it('handles concave polygon correctly', () => {
    // C-shape opening to the right
    const concave = [
      { latitude: 0, longitude: 0 },
      { latitude: 4, longitude: 0 },
      { latitude: 4, longitude: 4 },
      { latitude: 3, longitude: 4 },
      { latitude: 3, longitude: 1 },
      { latitude: 1, longitude: 1 },
      { latitude: 1, longitude: 4 },
      { latitude: 0, longitude: 4 },
    ];
    expect(isPointInPolygon({ latitude: 2, longitude: 0.5 }, concave)).toBe(true);
    expect(isPointInPolygon({ latitude: 2, longitude: 2 }, concave)).toBe(false);
  });
});
