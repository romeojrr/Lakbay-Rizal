// The dialogue box inside the scene frame keeps one height. When a step's text is too long
// for it, the reading text gets smaller, 1 px at a time, down to MIN_FONT_PX (owner request:
// "make the font size small to fit" rather than letting the box grow over the scene).
// The whole text is laid out from the start (the part not typed yet is only hidden), so the
// size is chosen once per step and does not change while the text types out.
import { useLayoutEffect, type RefObject } from 'react';

/** Smallest reading size used to make a long paragraph fit. */
export const MIN_FONT_PX = 16;

/**
 * The largest whole-pixel size from `base` down to `min` for which `fits(size)` is true, or
 * `min` when none fits.
 */
export function fitFontSize(base: number, min: number, fits: (size: number) => boolean): number {
  for (let size = Math.floor(base); size > min; size--) {
    if (fits(size)) return size;
  }
  return min;
}

export function useFitText(box: RefObject<HTMLElement>, enabled: boolean, stepKey: string) {
  useLayoutEffect(() => {
    const el = box.current;
    if (!enabled || !el) return;
    const fit = () => {
      const panel = el.querySelector<HTMLElement>('[data-step]');
      if (!panel) return;
      el.style.removeProperty('--fit-fs');
      if (panel.clientHeight === 0 || panel.scrollHeight <= panel.clientHeight) return;
      const base = parseFloat(getComputedStyle(el).getPropertyValue('--fs-body')) || 22;
      const size = fitFontSize(base - 1, MIN_FONT_PX, (s) => {
        el.style.setProperty('--fit-fs', `${s}px`);
        return panel.scrollHeight <= panel.clientHeight;
      });
      el.style.setProperty('--fit-fs', `${size}px`);
    };
    fit();
    // Again once the reading font has loaded, and whenever the box changes size.
    void document.fonts?.ready.then(fit);
    if (typeof ResizeObserver === 'undefined') return;
    let width = el.clientWidth;
    let height = el.clientHeight;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width && el.clientHeight === height) return;
      width = el.clientWidth;
      height = el.clientHeight;
      fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [box, enabled, stepKey]);
}
