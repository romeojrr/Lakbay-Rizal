// Every region's map in the same frame: the map covers the frame, and the first view shows
// the current stop and, when they fit, all the pins.
import { describe, expect, it } from 'vitest';
import { coverSize, startScroll } from './useZoomPan';

describe('coverSize', () => {
  it('fills the frame with no gaps, whatever the map shape', () => {
    // A 2:1 map (America) in a 1200 × 900 frame: as tall as the frame, wider than it.
    expect(coverSize(1200, 900, 2)).toEqual({ width: 1800, height: 900 });
    // A square map (Philippines): as wide as the frame, taller than it.
    expect(coverSize(1200, 900, 1)).toEqual({ width: 1200, height: 1200 });
  });
});

describe('startScroll', () => {
  it('centres the current stop when nothing else matters', () => {
    expect(startScroll(2000, 1000, 50, 50, 50)).toBe(500);
  });

  it('moves the view so every pin is inside it when they fit', () => {
    // Pins at 30 % – 70 % of a 2000 px map (600 – 1400 px) fit a 1000 px view; centring the
    // current stop (at 30 %) alone would leave the pin at 70 % outside.
    const at = startScroll(2000, 1000, 30, 30, 70);
    expect(at).toBeLessThanOrEqual(600 - 56);
    expect(at + 1000).toBeGreaterThanOrEqual(1400 + 56);
  });

  it('centres the pins when they cannot all fit', () => {
    expect(startScroll(2000, 1000, 10, 10, 90)).toBe(500);
  });

  it('never scrolls past the map', () => {
    expect(startScroll(2000, 1000, 2, 2, 2)).toBe(0);
    expect(startScroll(2000, 1000, 99, 99, 99)).toBe(1000);
    expect(startScroll(1000, 1000, 80, 80, 80)).toBe(0);
  });
});
