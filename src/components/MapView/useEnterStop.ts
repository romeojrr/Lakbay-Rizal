// "Enter <place>": the region map zooms in on the place like the landing's fly-down (same
// pace, same whoosh), the screen fades to white like the landing does, and the stop fades in
// from that white (owner, 2026-11-26). Used by the map card's Enter button and by the pins.
// With reduced motion, or if the map is not on screen, the stop opens at once.
import { useCallback, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { play } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useUi } from '../../store/ui';

/** How long the zoom takes before the stop opens: as slow as the landing's fly-down. */
export const ENTER_MS = 2400;
const ZOOM = 4.5;
/** The white veil: it fades in over the end of the zoom, then out over the opened stop. */
const VEIL_IN_MS = 450;
const VEIL_OUT_MS = 400;
const WHITE = '#fffdf8';
/** Reduced motion: the fade to white before the stop opens. */
const STILL_VEIL_MS = 250;

/** A zoom is playing: more clicks wait for it instead of starting another. */
let zooming = false;

/**
 * Keyframes that move `point` (in % of the layer) to the middle of the viewport while zooming
 * in geometrically, eased in and out.
 */
export function enterFrames(
  layer: { left: number; top: number; width: number; height: number },
  viewport: { left: number; top: number; width: number; height: number },
  point: { x: number; y: number },
  zoom = ZOOM,
  count = 30,
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

/**
 * A white veil over the page area (not the top bar), fading in over the last part of the zoom.
 * It lives on <body>, so it stays while the stop page replaces the map, then fades away.
 */
function whiteVeil(inMs = VEIL_IN_MS, delay = ENTER_MS - VEIL_IN_MS): { lift: () => void } {
  const area = document.querySelector('main')?.getBoundingClientRect();
  const veil = document.createElement('div');
  veil.setAttribute('aria-hidden', 'true');
  Object.assign(veil.style, {
    position: 'fixed',
    left: `${area?.left ?? 0}px`,
    top: `${area?.top ?? 0}px`,
    width: `${area?.width ?? window.innerWidth}px`,
    height: `${area?.height ?? window.innerHeight}px`,
    zIndex: '60',
    background: WHITE,
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'opacity',
  });
  document.body.append(veil);
  veil.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: inMs,
    delay,
    easing: 'ease-in',
    fill: 'forwards',
  });
  return {
    lift: () => {
      // Two frames: the stop page has painted under the veil before it fades.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const out = veil.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: VEIL_OUT_MS,
            easing: 'ease-out',
            fill: 'forwards',
          });
          out.onfinish = () => veil.remove();
          out.oncancel = () => veil.remove();
        }),
      );
    },
  };
}

/** A click handler for a link to a stop: zoom in on its place, then open it. */
export function useEnterStop() {
  const navigate = useNavigate();
  const still = useReducedMotion();
  return useCallback(
    (event: MouseEvent, stopId: string, region: string, point: { x: number; y: number }) => {
      // New tab or new window: the link works as a plain link.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (still) {
        // Reduced motion: no zoom, just a short fade to white and back (opacity only).
        event.preventDefault();
        if (zooming) return;
        zooming = true;
        const to = `/stop/${stopId}`;
        const veil = whiteVeil(STILL_VEIL_MS, 0);
        window.setTimeout(() => {
          zooming = false;
          if (window.location.pathname !== to) navigate(to);
          veil.lift();
        }, STILL_VEIL_MS);
        return;
      }
      if (!document.querySelector(`[data-map-layer="${region}"]`)) return;
      event.preventDefault();
      if (zooming) return;
      zooming = true;
      play('whoosh'); // the same rush of air as the landing's fly-down
      const to = `/stop/${stopId}`;
      // The map shows this place's own pin (e.g. "Ateneo", not "Manila area") while it zooms.
      useUi.setState({ entering: stopId });
      const veil = whiteVeil();
      void zoomInto(region, point).then(() => {
        zooming = false;
        // Something else (the tour) may already have opened it.
        if (window.location.pathname !== to) navigate(to);
        useUi.setState({ entering: null });
        veil.lift();
      });
    },
    [navigate, still],
  );
}
