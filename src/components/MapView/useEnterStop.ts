// "Enter <place>": the region map zooms in on the place, then the stop opens (owner,
// 2026-11-26). Used by the map card's Enter button and by the pins. With reduced motion, or if
// the map is not on screen, the stop opens at once.
import { useCallback, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '../../lib/useReducedMotion';

/** How long the zoom takes before the stop opens. */
export const ENTER_MS = 750;
const ZOOM = 4.5;

/**
 * Keyframes that move `point` (in % of the layer) to the middle of the viewport while zooming
 * in geometrically, eased in and out, then fading the map at the end.
 */
export function enterFrames(
  layer: { left: number; top: number; width: number; height: number },
  viewport: { left: number; top: number; width: number; height: number },
  point: { x: number; y: number },
  zoom = ZOOM,
  count = 24,
): Keyframe[] {
  const px = layer.left + (point.x / 100) * layer.width;
  const py = layer.top + (point.y / 100) * layer.height;
  const dx = viewport.left + viewport.width / 2 - px;
  const dy = viewport.top + viewport.height / 2 - py;
  const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
  const frames: Keyframe[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const p = ease(t);
    const z = zoom ** p;
    const m = (z - 1) / (zoom - 1);
    frames.push({
      offset: t,
      opacity: t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3,
      transform: `translate(${(dx * m).toFixed(2)}px, ${(dy * m).toFixed(2)}px) scale(${z.toFixed(4)})`,
    });
  }
  return frames;
}

/** Plays the zoom on the region map showing `region`; resolves when it ends (or at once). */
function zoomInto(region: string, point: { x: number; y: number }): Promise<void> {
  const layer = document.querySelector<HTMLElement>(`[data-map-layer="${region}"]`);
  const viewport = layer?.parentElement;
  if (!layer || !viewport || typeof layer.animate !== 'function') return Promise.resolve();
  layer.style.transformOrigin = `${point.x}% ${point.y}%`;
  layer.style.willChange = 'transform, opacity';
  const animation = layer.animate(
    enterFrames(layer.getBoundingClientRect(), viewport.getBoundingClientRect(), point),
    { duration: ENTER_MS, easing: 'linear', fill: 'forwards' },
  );
  return animation.finished.then(
    () => undefined,
    () => undefined,
  );
}

/** A click handler for a link to a stop: zoom in on its place, then open it. */
export function useEnterStop() {
  const navigate = useNavigate();
  const still = useReducedMotion();
  return useCallback(
    (event: MouseEvent, stopId: string, region: string, point: { x: number; y: number }) => {
      // New tab, new window, or reduced motion: the link works as a plain link.
      if (still || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (!document.querySelector(`[data-map-layer="${region}"]`)) return;
      event.preventDefault();
      const to = `/stop/${stopId}`;
      void zoomInto(region, point).then(() => {
        // Something else (the tour) may already have opened it.
        if (window.location.pathname !== to) navigate(to);
      });
    },
    [navigate, still],
  );
}
