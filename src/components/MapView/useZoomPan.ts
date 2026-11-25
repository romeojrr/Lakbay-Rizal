// Zoom (1×, 1.5×, 2×) and drag-to-pan for the map (FR-16).
// The map layer grows inside a scrolling viewport, so pins (positioned in %) stay on their
// towns and keep their size. Touch uses native scrolling; mouse drag scrolls by hand.
import { useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

export const ZOOM_LEVELS = [1, 1.5, 2] as const;

/** Below this map width (in px, after zoom) only the important pin labels are shown. */
const COMPACT_WIDTH = 560;
const DRAG_THRESHOLD = 4;

interface Drag {
  pointerId: number;
  x: number;
  y: number;
  left: number;
  top: number;
  moved: boolean;
}

export function useZoomPan() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  const [width, setWidth] = useState(0);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const keepCenter = useRef<{ x: number; y: number } | null>(null);
  const zoom = ZOOM_LEVELS[level] ?? 1;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // After a zoom change, scroll so the same spot stays in the middle.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    const center = keepCenter.current;
    if (!el || !center) return;
    el.scrollLeft = center.x * el.scrollWidth - el.clientWidth / 2;
    el.scrollTop = center.y * el.scrollHeight - el.clientHeight / 2;
    keepCenter.current = null;
  }, [level]);

  const zoomTo = (next: number) => {
    const el = viewportRef.current;
    if (el && el.scrollWidth > 0) {
      keepCenter.current = {
        x: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        y: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setLevel(Math.min(ZOOM_LEVELS.length - 1, Math.max(0, next)));
  };

  const handlers = {
    onPointerDown(event: PointerEvent<HTMLDivElement>) {
      const el = viewportRef.current;
      if (!el || zoom === 1 || event.pointerType !== 'mouse' || event.button !== 0) return;
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: el.scrollLeft,
        top: el.scrollTop,
        moved: false,
      };
    },
    onPointerMove(event: PointerEvent<HTMLDivElement>) {
      const el = viewportRef.current;
      const d = drag.current;
      if (!el || !d || d.pointerId !== event.pointerId) return;
      const dx = event.clientX - d.x;
      const dy = event.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        d.moved = true;
        el.setPointerCapture(event.pointerId);
      }
      if (d.moved) {
        el.scrollLeft = d.left - dx;
        el.scrollTop = d.top - dy;
      }
    },
    onPointerUp() {
      suppressClick.current = drag.current?.moved ?? false;
      drag.current = null;
    },
    onPointerCancel() {
      drag.current = null;
    },
    // A drag that ends on a pin must not open it.
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };

  return {
    viewportRef,
    zoom,
    canZoomIn: level < ZOOM_LEVELS.length - 1,
    canZoomOut: level > 0,
    zoomIn: () => zoomTo(level + 1),
    zoomOut: () => zoomTo(level - 1),
    compact: width > 0 && width * zoom < COMPACT_WIDTH,
    handlers,
  };
}
