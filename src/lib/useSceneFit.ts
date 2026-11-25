// SRS v2.3 §5.5: show a pixel scene at the largest whole-number scale that fits the content
// area (width) and the screen (height). If that would waste much of the space (e.g. 1× on a
// tablet), fill the width instead; `image-rendering: pixelated` keeps the pixels square.
import { useLayoutEffect, useState, type RefObject } from 'react';

export interface SceneFit {
  /** Width in px, or undefined before the first measurement (CSS then uses 100%). */
  width: number | undefined;
  /** Whole-number scale used, or 0 when the width was filled instead. */
  scale: number;
  /** Lay the text box over the scene (wide scenes and landscape phones). */
  overlay: boolean;
  /** A phone held sideways: the scene should fill the screen (§5.5). */
  landscape?: boolean;
}

/** A whole-number scale is used when it fills at least this share of the width. */
const MIN_INTEGER_SHARE = 0.75;
/** Scenes at least this wide get the text box overlaid on their bottom (§5.5). */
const OVERLAY_WIDTH = 900;

export function computeSceneFit(
  available: number,
  availableHeight: number,
  native: { w: number; h: number },
  landscapePhone: boolean,
): SceneFit {
  if (available <= 0) return { width: undefined, scale: 0, overlay: false };
  // The largest size that fits both the width and the screen height.
  const maxWidth = Math.min(available, Math.max(availableHeight, 180) * (native.w / native.h));
  const scale = Math.min(Math.floor(available / native.w), Math.floor(availableHeight / native.h));
  const fitsInteger = scale >= 1 && native.w * scale >= maxWidth * MIN_INTEGER_SHARE;
  const width = fitsInteger ? native.w * scale : Math.round(maxWidth);
  return {
    width,
    scale: fitsInteger ? scale : 0,
    overlay: width >= OVERLAY_WIDTH || landscapePhone,
  };
}

/**
 * `chrome` = the frame around the picture (wood padding + borders), so the picture itself —
 * not the frame — gets the whole-number scale. Returns the width of the framed box.
 */
export function useSceneFit(
  ref: RefObject<HTMLElement>,
  nativeW: number,
  nativeH: number,
  chrome = 0,
): SceneFit {
  const [fit, setFit] = useState<SceneFit>({ width: undefined, scale: 0, overlay: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const landscapePhone = window.innerHeight <= 500 && window.innerWidth > window.innerHeight;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // Landscape phones: the scene may fill the whole screen height (§5.5).
      const availableHeight = landscapePhone
        ? window.innerHeight - 28
        : window.innerHeight - top - 16;
      const picture = computeSceneFit(
        el.clientWidth - chrome,
        availableHeight - chrome,
        { w: nativeW, h: nativeH },
        landscapePhone,
      );
      const next = {
        ...picture,
        width: picture.width === undefined ? undefined : picture.width + chrome,
        landscape: landscapePhone,
      };
      setFit((prev) =>
        prev.width === next.width &&
        prev.overlay === next.overlay &&
        prev.landscape === next.landscape
          ? prev
          : next,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [ref, nativeW, nativeH, chrome]);

  return fit;
}
