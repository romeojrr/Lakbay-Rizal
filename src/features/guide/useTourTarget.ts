// Finds the element a tour step points at (its data-guide id) and keeps its position.
import { useEffect, useState } from 'react';

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** The first matching element that is actually on screen (some ids exist twice, e.g. on phones). */
export function findTarget(id: string): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>(`[data-guide="${id}"]`)];
  return (
    all.find((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    }) ?? null
  );
}

const WAIT_MS = 1500;

/**
 * Looks for the target (pages load on demand, so it may appear a little later), scrolls it
 * into view and follows it on scroll and resize. `null` = no target: a centred card.
 * `prepare` runs once if the target is missing (e.g. move the story to a spoken line).
 */
export function useTourTarget(
  id: string | null,
  key: string,
  prepare?: () => void,
): { element: HTMLElement | null; box: Box | null; searching: boolean } {
  const [found, setFound] = useState<{ key: string; element: HTMLElement | null } | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    if (!id) return;
    let prepared = false;
    const started = performance.now();
    let frame = 0;
    const look = () => {
      const element = findTarget(id);
      if (element) {
        element.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        setFound({ key, element });
        return;
      }
      if (!prepared && prepare) {
        prepared = true;
        prepare();
      }
      if (performance.now() - started > WAIT_MS) setFound({ key, element: null });
      else frame = requestAnimationFrame(look);
    };
    frame = requestAnimationFrame(look);
    return () => cancelAnimationFrame(frame);
  }, [id, key, prepare]);

  const element = id && found?.key === key ? found.element : null;

  useEffect(() => {
    if (!element) return;
    const measure = () => {
      const r = element.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer?.disconnect();
    };
  }, [element]);

  return {
    element,
    box: element ? box : null,
    searching: id !== null && found?.key !== key,
  };
}
