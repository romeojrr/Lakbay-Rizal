import { describe, expect, it } from 'vitest';
import { computeSceneFit } from './useSceneFit';

const scene = { w: 384, h: 216 };

describe('computeSceneFit (SRS v2.3 §5.5)', () => {
  it('1440 × 900: 3× = 1152 px, at least 70 % of the viewport (FR-91), text overlaid', () => {
    const fit = computeSceneFit(1392, 720, scene, false);
    expect(fit).toEqual({ width: 1152, scale: 3, overlay: true });
    expect(fit.width).toBeGreaterThanOrEqual(1440 * 0.7);
  });

  it('1920 × 1080: 4× = 1536 px inside the 1600 px content area', () => {
    expect(computeSceneFit(1600, 900, scene, false)).toEqual({
      width: 1536,
      scale: 4,
      overlay: true,
    });
  });

  it('the screen height limits the scale', () => {
    expect(computeSceneFit(1600, 500, scene, false)).toEqual({
      width: 768,
      scale: 2,
      overlay: false,
    });
  });

  it('768 px tablet: 1× would waste half the width, so it fills the width', () => {
    const fit = computeSceneFit(720, 800, scene, false);
    expect(fit.scale).toBe(0);
    expect(fit.width).toBe(720);
    expect(fit.overlay).toBe(false);
  });

  it('360 px phone: fills the width, text box below the scene', () => {
    expect(computeSceneFit(328, 600, scene, false)).toEqual({
      width: 328,
      scale: 0,
      overlay: false,
    });
  });

  it('landscape phone: fills the screen height and overlays the text', () => {
    const fit = computeSceneFit(692, 360, scene, true);
    expect(fit.width).toBe(640);
    expect(fit.overlay).toBe(true);
  });

  it('before the first measurement, leaves the size to CSS', () => {
    expect(computeSceneFit(0, 0, scene, false).width).toBeUndefined();
  });
});
