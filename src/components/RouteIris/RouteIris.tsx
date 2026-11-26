import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../lib/useReducedMotion';
import styles from './RouteIris.module.css';

/**
 * SRS v2.3 §5.6 route change: an "iris" — an ink circle that closes smoothly over the new page
 * (480 ms, eased; it used to jump in 8 steps), revealing it from the edges. With reduced
 * motion: a 150 ms fade. It never takes clicks, and it does not run on the first page load.
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
    if (!el || typeof el.animate !== 'function') return;
    // U9: the landing's fly-down ends in a fade; the map fades in from the same colour.
    if (fromLanding) {
      el.style.background = '#3d84c0';
      const fade = el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 400,
        easing: 'ease-out',
      });
      fade.onfinish = () => {
        el.style.background = '';
      };
      return () => fade.cancel();
    }
    const animation = still
      ? el.animate([{ opacity: 0.35 }, { opacity: 0 }], { duration: 150, easing: 'ease-out' })
      : el.animate(
          [
            { opacity: 1, clipPath: 'circle(75% at 50% 50%)' },
            { opacity: 1, clipPath: 'circle(0% at 50% 50%)' },
          ],
          { duration: 480, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        );
    return () => animation.cancel();
  }, [pathname, still]);

  return <div ref={ref} className={styles.iris} aria-hidden="true" />;
}
