import { useEffect, useState } from 'react';
import type { Guide } from '../../content/schemas.v3';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { play } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import styles from './Landing.module.css';

/** How long each line stays before Rizal says the next one by himself. */
export const SAY_MS = 4800;

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

/**
 * What Rizal says on the welcome card: his own lines from the tour (guide.json, so in the
 * player's language), never new words. The greeting (t1), then the last two lines of the
 * farewell (t14): "My mother was my first teacher…", "Shall we?".
 */
export function landingLines(guide: Guide): string[] {
  const first = guide.tour.find((step) => step.id === 't1');
  const last = guide.tour.find((step) => step.id === 't14');
  const hello = first ? sentences(first.text) : [];
  return [
    ...(hello.length > 2 ? [hello.slice(0, 2).join(' '), ...hello.slice(2)] : hello),
    ...(last ? sentences(last.text).slice(-2) : []),
  ];
}

/**
 * Rizal in his little window with a speech bubble (owner, 2026-11-26: he stands still, and
 * talks instead). A new line every few seconds until the last one; a click on him says the
 * next line at once (and starts again after the last).
 */
export default function RizalSays({ guide }: { guide: Guide }) {
  const still = useReducedMotion();
  const lines = landingLines(guide);
  const [index, setIndex] = useState(0);
  // Read out by screen readers only once the player asks (not every few seconds).
  const [asked, setAsked] = useState(false);
  const atEnd = index >= lines.length - 1;

  useEffect(() => {
    if (asked || atEnd) return;
    const timer = window.setTimeout(() => setIndex((i) => i + 1), SAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, asked, atEnd]);

  const line = lines[Math.min(index, lines.length - 1)];
  return (
    <div className={styles.portrait}>
      <span className={styles.sun} aria-hidden="true" />
      {line && (
        <p
          key={index}
          className={cx(styles.say, still ? 'motion-fade' : styles.sayPop)}
          aria-live={asked ? 'polite' : 'off'}
        >
          {line}
        </p>
      )}
      <button
        type="button"
        className={styles.talk}
        aria-label={t('landing.talk')}
        title={t('landing.talk')}
        onClick={() => {
          setAsked(true);
          setIndex((i) => (i + 1) % Math.max(lines.length, 1));
          play('talk');
        }}
      >
        <img
          className={`pix ${styles.rizal}`}
          src={asset('assets/sprites/rizal_adult_suit.png')}
          alt=""
          width={102}
          height={234}
        />
      </button>
      <span className={styles.ground} aria-hidden="true" />
    </div>
  );
}
