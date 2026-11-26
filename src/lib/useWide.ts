import { useLayoutEffect, useState, type RefObject } from 'react';

/** Same as the screens' container queries: wider than this, the side column sits beside. */
export const WIDE = 960;

/**
 * True while the element is wider than the two-column breakpoint (and not a phone held
 * sideways): the main area is then one screen tall, the same frame as the region maps.
 */
export function useWide(ref: RefObject<HTMLElement>): boolean {
  const [wide, setWide] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWide(el.clientWidth > WIDE && window.innerHeight > 500);
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref]);
  return wide;
}
