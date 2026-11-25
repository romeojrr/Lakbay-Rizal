import { useState } from 'react';
import type { Character } from '../../content/schemas';
import { asset } from '../../lib/asset';
import styles from './Portrait.module.css';

const BOX = 72;
const SCALE = 3;

interface Crop {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Head-and-shoulders crop of a sprite at 3× (SRS §5.4). An adult 34 × 78 sprite gives the
 * mockup's left −12, top −18, 102 × 234. A character's `portrait` in content overrides this.
 */
export function defaultCrop(width: number, height: number): Crop {
  const w = width * SCALE;
  return {
    left: Math.round((BOX - w) / 2) + 3,
    top: height >= 60 ? -18 : -3,
    width: w,
    height: height * SCALE,
  };
}

/** Narrator icon: a pixel book on an 8 × 8 grid (SRS §3.6, §7.7). */
function BookIcon() {
  return (
    <svg
      className={styles.book}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="1" width="8" height="6" fill="var(--ink)" />
      <rect x="1" y="2" width="2.5" height="4" fill="var(--card-warm)" />
      <rect x="4.5" y="2" width="2.5" height="4" fill="var(--card-warm)" />
      <rect x="1.5" y="3" width="1.5" height="0.5" fill="var(--muted)" />
      <rect x="5" y="3" width="1.5" height="0.5" fill="var(--muted)" />
      <rect x="1.5" y="4" width="1.5" height="0.5" fill="var(--muted)" />
      <rect x="5" y="4" width="1.5" height="0.5" fill="var(--muted)" />
    </svg>
  );
}

/** The speaker's face in the dialogue box; the narrator gets a book. */
export default function Portrait({ character }: { character: Character | undefined }) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const sprite = character?.sprite;
  const crop = character?.portrait ?? (natural ? defaultCrop(natural.w, natural.h) : null);

  return (
    <div className={styles.box}>
      {sprite ? (
        <img
          className={`pix ${styles.sprite}`}
          src={asset(sprite)}
          alt=""
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={crop ?? { visibility: 'hidden' }}
        />
      ) : (
        <BookIcon />
      )}
    </div>
  );
}
