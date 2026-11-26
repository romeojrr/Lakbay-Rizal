// SRS v2.3 §3.6 keyboard: → / Space / Enter = next, ← = back.
import { useEffect, useRef } from 'react';

interface Keys {
  next: () => void;
  back: () => void;
}

const TYPING = 'input, textarea, select, [contenteditable="true"]';
/** Space and Enter already press a focused button or link; do not press twice. */
const PRESSABLE = 'button, a[href], summary, [role="button"]';

export function useStoryKeys(keys: Keys): void {
  // The listener is added once; it always calls the latest handlers.
  const latest = useRef(keys);
  useEffect(() => {
    latest.current = keys;
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(TYPING)) return;
      // A dialog (Read more, the tour) is open: keys belong to it.
      if (document.querySelector('dialog[open]')) return;
      const { next, back } = latest.current;
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          back();
          break;
        case ' ':
        case 'Enter':
          if (target?.closest(PRESSABLE)) return;
          event.preventDefault();
          next();
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
