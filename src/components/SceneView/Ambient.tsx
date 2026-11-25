import type { CSSProperties } from 'react';
import { useReducedMotion } from '../../lib/useReducedMotion';
import styles from './Ambient.module.css';

export type AmbientKind = 'rain' | 'petals' | 'snow' | 'leaves' | 'dust' | 'candle' | 'glints';

/** SRS v2.3 §5.6: the ambient effect of each stop (none for the others, or the final stop). */
export const AMBIENT: Record<string, AmbientKind> = {
  'binan-1869': 'rain',
  'japan-1888': 'petals',
  'brussels-1890': 'snow',
  'madrid-1882': 'leaves',
  'london-1888': 'dust',
  'ghent-1891': 'dust',
  'fortsantiago-1896': 'candle',
  'dapitan-1892': 'glints',
};

const COUNT: Record<AmbientKind, number> = {
  rain: 40,
  petals: 18,
  snow: 30,
  leaves: 14,
  dust: 20,
  candle: 0,
  glints: 16,
};

/** A fixed pseudo-random sequence, so the particles do not jump on every render. */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Up to 40 small particles over the scene, moved by CSS transforms only (§5.6); the candle
 * is a faint flickering shade. Nothing at all with reduced motion.
 */
export default function Ambient({ kind }: { kind: AmbientKind | undefined }) {
  const still = useReducedMotion();
  if (!kind || still) return null;
  if (kind === 'candle') return <div className={styles.candle} aria-hidden="true" />;
  const fast = kind === 'rain';
  return (
    <div className={`${styles.layer} ${styles[kind]}`} aria-hidden="true">
      {Array.from({ length: COUNT[kind] }, (_, i) => (
        <span
          key={i}
          style={
            {
              left: `${seeded(i + 1) * 100}%`,
              top: kind === 'dust' || kind === 'glints' ? `${20 + seeded(i + 7) * 70}%` : undefined,
              animationDelay: `${-seeded(i + 3) * 6}s`,
              animationDuration: `${(fast ? 0.6 : 4) + seeded(i + 5) * (fast ? 0.4 : 4)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
