import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../lib/useReducedMotion';
import styles from './RouteIris.module.css';

/**
 * SRS v2.3 §5.6 route change: a pixel "iris" — an ink circle that closes over the new page in
 * 8 steps (320 ms), revealing it from the edges. With reduced motion: a 150 ms fade. It never
 * takes clicks, and it does not run on the first page load.
 */
export default function RouteIris() {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const still = useReducedMotion();

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;
    const animation = still
      ? el.animate([{ opacity: 0.35 }, { opacity: 0 }], { duration: 150, easing: 'ease-out' })
      : el.animate(
          [
            { opacity: 1, clipPath: 'circle(75% at 50% 50%)' },
            { opacity: 1, clipPath: 'circle(0% at 50% 50%)' },
          ],
          { duration: 320, easing: 'steps(8)' },
        );
    return () => animation.cancel();
  }, [pathname, still]);

  return <div ref={ref} className={styles.iris} aria-hidden="true" />;
}
