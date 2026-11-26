// Long text in the scene's dialogue box gets a smaller font instead of a taller box.
import { describe, expect, it } from 'vitest';
import { fitFontSize, MIN_FONT_PX } from './useFitText';

describe('fitFontSize', () => {
  it('keeps the largest size that fits', () => {
    // Text that fits at 19 px or smaller.
    expect(fitFontSize(21, MIN_FONT_PX, (s) => s <= 19)).toBe(19);
  });

  it('never goes below the smallest reading size', () => {
    expect(fitFontSize(21, MIN_FONT_PX, () => false)).toBe(MIN_FONT_PX);
    expect(MIN_FONT_PX).toBeGreaterThanOrEqual(16);
  });
});
