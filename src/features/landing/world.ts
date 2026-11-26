// U9 world map (assets/maps/world.png, 512 × 288, equirectangular):
// longitude −150 … 170 across, latitude 80 … −78.4 down.
import type { Stop } from '../../content/schemas';

export const WORLD = { w: 512, h: 288, lon0: -150, lon1: 170, lat0: 80, lat1: -78.4 } as const;

/** A place on the world map, in % of its width and height. */
export interface WorldPoint {
  x: number;
  y: number;
}

export function worldPoint(lat: number, lon: number): WorldPoint {
  return {
    x: ((lon - WORLD.lon0) / (WORLD.lon1 - WORLD.lon0)) * 100,
    y: ((WORLD.lat0 - lat) / (WORLD.lat0 - WORLD.lat1)) * 100,
  };
}

/** The SVG overlay uses a 100 × 56.25 view box (16:9), so x is % and y is % × 0.5625. */
export const VIEW_H = 56.25;

/**
 * The route between consecutive stops as gentle arcs (SVG path data). A leg longer than half
 * the map (Tokyo → San Francisco) goes the short way across the Pacific: off the right edge
 * and back in from the left. Legs that stay in one town are left out.
 */
export function routePaths(stops: readonly Stop[]): string[] {
  const points = [...stops]
    .sort((a, b) => a.order - b.order)
    .map((s) => worldPoint(s.place.lat, s.place.lon));
  const paths: string[] = [];
  const arc = (a: WorldPoint, b: WorldPoint) => {
    const ay = (a.y * VIEW_H) / 100;
    const by = (b.y * VIEW_H) / 100;
    const mx = (a.x + b.x) / 2;
    const my = (ay + by) / 2;
    const dist = Math.hypot(b.x - a.x, by - ay);
    // Bow the line to the left of its direction, more for long legs.
    const bow = Math.min(dist * 0.18, 6);
    const nx = -(by - ay) / (dist || 1);
    const ny = (b.x - a.x) / (dist || 1);
    const c = { x: mx + nx * bow, y: my + ny * bow - bow * 0.4 };
    return `M${a.x.toFixed(2)} ${ay.toFixed(2)} Q${c.x.toFixed(2)} ${c.y.toFixed(2)} ${b.x.toFixed(2)} ${by.toFixed(2)}`;
  };
  points.forEach((a, i) => {
    const b = points[i + 1];
    if (!b || Math.hypot(b.x - a.x, b.y - a.y) < 0.4) return;
    if (b.x - a.x > 50) {
      paths.push(arc(a, { x: b.x - 100, y: b.y }), arc({ x: a.x + 100, y: a.y }, b));
    } else if (a.x - b.x > 50) {
      paths.push(arc(a, { x: b.x + 100, y: b.y }), arc({ x: a.x - 100, y: a.y }, b));
    } else {
      paths.push(arc(a, b));
    }
  });
  return paths;
}

/** Pins: one per place (stops in the same town share a pin). */
export function pinPoints(stops: readonly Stop[]): WorldPoint[] {
  const seen = new Map<string, WorldPoint>();
  for (const stop of stops) {
    const p = worldPoint(stop.place.lat, stop.place.lon);
    seen.set(`${p.x.toFixed(1)}:${p.y.toFixed(1)}`, p);
  }
  return [...seen.values()];
}

/** The camera move that brings `target` to the middle of the screen at `zoom`. */
export function flyTransform(
  box: { left: number; top: number; width: number; height: number },
  target: WorldPoint,
  view: { width: number; height: number },
  zoom: number,
): { origin: string; to: string } {
  const px = box.left + (target.x / 100) * box.width;
  const py = box.top + (target.y / 100) * box.height;
  return {
    origin: `${target.x}% ${target.y}%`,
    to: `translate(${view.width / 2 - px}px, ${view.height / 2 - py}px) scale(${zoom})`,
  };
}

/**
 * The fly-down as keyframes: the camera moves and zooms together, and the zoom grows
 * geometrically (×1 → ×zoom), so it feels like a steady fall towards the ground instead of a
 * rush at the start and a crawl at the end. Eased in and out; many frames, so the browser
 * interpolates smoothly between them.
 */
export function flyFrames(
  box: { left: number; top: number; width: number; height: number },
  target: WorldPoint,
  view: { width: number; height: number },
  zoom: number,
  count = 30,
): { origin: string; frames: Keyframe[] } {
  const px = box.left + (target.x / 100) * box.width;
  const py = box.top + (target.y / 100) * box.height;
  const dx = view.width / 2 - px;
  const dy = view.height / 2 - py;
  const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
  const frames: Keyframe[] = [];
  for (let i = 0; i <= count; i++) {
    const p = ease(i / count);
    // The move follows the zoom's progress on a log scale, so the target drifts to the
    // middle at the same pace as the ground comes closer.
    const z = zoom ** p;
    const m = zoom === 1 ? p : (z - 1) / (zoom - 1);
    frames.push({
      offset: i / count,
      transform: `translate(${(dx * m).toFixed(2)}px, ${(dy * m).toFixed(2)}px) scale(${z.toFixed(4)})`,
    });
  }
  return { origin: `${target.x}% ${target.y}%`, frames };
}
