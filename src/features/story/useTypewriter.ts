// SRS v2.3 §3.6: text appears letter by letter (about 40 characters a second; 25 on the
// final stop). The first press shows the whole text, the next one moves on (see the player).
import { useCallback, useEffect, useState } from 'react';

export interface Typewriter {
  /** How many characters are showing. */
  shown: number;
  done: boolean;
  /** Shows the whole text now. */
  finish: () => void;
}

/**
 * `key` restarts the typing for a new step even when two steps have the same text.
 * `instant` (reduced motion, or a step that does not type) shows everything at once.
 */
export function useTypewriter(
  text: string,
  key: string,
  cps: number,
  instant: boolean,
): Typewriter {
  // Progress belongs to one step: a new key starts again from nothing.
  const [progress, setProgress] = useState({ key, shown: 0 });
  const shown = instant ? text.length : progress.key === key ? progress.shown : 0;

  useEffect(() => {
    if (instant) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const count = Math.min(text.length, Math.floor(((now - start) / 1000) * cps));
      setProgress((prev) =>
        prev.key === key && prev.shown >= count ? prev : { key, shown: count },
      );
      if (count < text.length) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, key, cps, instant]);

  const finish = useCallback(() => setProgress({ key, shown: text.length }), [key, text.length]);
  return { shown, done: shown >= text.length, finish };
}
