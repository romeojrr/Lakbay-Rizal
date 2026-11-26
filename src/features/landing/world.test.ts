// U9 world map: the projection, the route (with the Pacific wrap) and the camera move.
import { describe, expect, it } from 'vitest';
import { realContent } from '../../test/content';
import { flyTransform, pinPoints, routePaths, worldPoint } from './world';

const { stops } = realContent();
const at = (id: string) => {
  const stop = stops.find((s) => s.id === id);
  if (!stop) throw new Error(id);
  return worldPoint(stop.place.lat, stop.place.lon);
};

describe('world projection (U9)', () => {
  it('puts the stops where they are on world.png', () => {
    // Calamba on Luzon, Berlin in central Europe, San Francisco on the left edge.
    expect(at('calamba-1861').x).toBeCloseTo(84.7, 1);
    expect(at('calamba-1861').y).toBeCloseTo(41.5, 1);
    expect(at('berlin-1887').x).toBeCloseTo(51.1, 1);
    expect(at('usa-1888').x).toBeCloseTo(8.6, 1);
  });

  it('one pin per place', () => {
    const pins = pinPoints(stops);
    expect(pins.length).toBeLessThan(stops.length);
    expect(pins.length).toBeGreaterThan(15);
  });
});

describe('route (U9)', () => {
  it('crosses the Pacific from Tokyo to San Francisco, wrapping at the edges', () => {
    const paths = routePaths(stops);
    // Tokyo (x ≈ 90.5) to San Francisco (x ≈ 8.6): two arcs, one ending past the right edge
    // (x ≈ 108.6), one starting before the left edge (x ≈ −9.5).
    expect(
      paths.some(
        (d) => / 108\.\d+ /.test(` ${d.split(' ').slice(-2).join(' ')} `) || d.includes(' 108.'),
      ),
    ).toBe(true);
    expect(paths.some((d) => d.startsWith('M-9.'))).toBe(true);
    // No leg is drawn straight across the whole map.
    for (const d of paths) {
      const xs = [...d.matchAll(/[MQ ](-?\d+\.\d+) -?\d+\.\d+/g)].map((m) => Number(m[1]));
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(60);
    }
  });
});

describe('fly-down camera (U9)', () => {
  it('brings the target to the middle of the screen', () => {
    const box = { left: -100, top: 0, width: 1600, height: 900 };
    const view = { width: 1400, height: 900 };
    const target = { x: 84.7, y: 41.5 };
    const move = flyTransform(box, target, view, 10);
    const px = box.left + 0.847 * box.width;
    const py = 0.415 * box.height;
    expect(move.origin).toBe('84.7% 41.5%');
    const [dx, dy] = [...move.to.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    // Scaling around the target keeps it in place; the move then centres it.
    expect(px + (dx ?? 0)).toBeCloseTo(700);
    expect(py + (dy ?? 0)).toBeCloseTo(450);
  });
});
