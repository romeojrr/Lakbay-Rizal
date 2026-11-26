import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Route change (SRS v2.3 §5.6). Owner, 2026-11-26: no circle wipe — something smooth. The new
 * page fades in (opacity only, so nothing shifts, blurs or flashes a colour). After the
 * landing's fly-down, the map fades in a little more slowly. Reduced motion: a quick fade. It
 * never takes clicks and does not run on the first page load.
 */
let lastPath: string | null = null;

const EASE = 'cubic-bezier(0.2, 0.7, 0.3, 1)';

export default function RouteIris() {
  const { pathname } = useLocation();
  const still = useReducedMotion();

  useEffect(() => {
    // Kept outside the component: the landing and the other pages each mount their own.
    const before = lastPath;
    lastPath = pathname;
    if (before === null || before === pathname) return; // the first page load
    const page = document.querySelector('main');
    if (!page || typeof page.animate !== 'function') return;
    const duration = still ? 150 : before === '/' ? 650 : 320;
    const animation = page.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: EASE });
    return () => animation.cancel();
  }, [pathname, still]);

  return null;
}
