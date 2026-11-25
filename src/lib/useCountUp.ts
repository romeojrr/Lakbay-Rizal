// §5.6 "XP number counts up": a number moves to its new value over 400 ms (at once with
// reduced motion, and on the first render).
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const DURATION = 400;

export function useCountUp(value: number): number {
  const still = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (still || start === value || typeof requestAnimationFrame === 'undefined') {
      setShown(value);
      return;
    }
    const began = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - began) / DURATION);
      setShown(Math.round(start + (value - start) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [value, still]);

  return still ? value : shown;
}
