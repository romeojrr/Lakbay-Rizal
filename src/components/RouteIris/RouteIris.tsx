import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../lib/useReducedMotion';
import styles from './RouteIris.module.css';

/**
 * Route change: no transition between pages (owner, 2026-11-26: no circle wipe). The one
 * exception is the landing's fly-down, which ends in a blue fade that the map fades in from.
 * It never takes clicks, and it does not run on the first page load.
 */
let lastPath: string | null = null;

export default function RouteIris() {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();

  useEffect(() => {
    // Kept outside the component: the landing and the other pages each mount their own iris.
    const before = lastPath;
    lastPath = pathname;
    if (before === null || before === pathname) return; // the first page load
    const fromLanding = before === '/';
    const el = ref.current;
    if (!fromLanding || !el || typeof el.animate !== 'function') return;
    // U9: the landing's fly-down ends in a fade; the map fades in from the same colour.
    el.style.background = '#3d84c0';
    const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: still ? 150 : 400,
      easing: 'ease-out',
    });
    fade.onfinish = () => {
      el.style.background = '';
    };
    return () => fade.cancel();
  }, [pathname, still]);

  return <div ref={ref} className={styles.iris} aria-hidden="true" />;
}
