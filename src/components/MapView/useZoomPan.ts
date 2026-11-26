// Zoom (1×, 1.5×, 2×) and drag-to-pan for the map (FR-16).
// Every region's map sits in the same fixed frame. At 1× the whole map fits inside it (like
// `object-fit: contain`; owner, 2026-11-26: "zoom out … by default"), centred, with the sea
// colour around it; zooming in makes it bigger than the frame and it can be panned. The view
// starts centred on `focus` (the current stop). The map layer grows inside
// a scrolling viewport, so pins (positioned in %) stay on their towns and keep their size.
// Touch uses native scrolling; mouse drag scrolls by hand.
import { useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

export const ZOOM_LEVELS = [1, 1.5, 2.25, 3] as const;

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

/** Size of the map at 1× so all of it fits a `w` × `h` frame (`ratio` = map width / height). */
export function fitSize(w: number, h: number, ratio: number) {
  const width = Math.min(w, h * ratio);
  return { width, height: width / ratio };
}

/** Pins' extent on the map, in % (x0–x1 across, y0–y1 down). */
export interface PinBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Room kept between an edge of the frame and the outermost pin, in px. */
const EDGE_ROOM = 56;

/**
 * Scroll offset along one axis: centre `focus` (%), then shift so the pins (`lo`–`hi`, %)
 * are all in view when they fit; otherwise centre the pins. Clamped to the map.
 */
export function startScroll(
  mapSize: number,
  view: number,
  focus: number,
  lo: number,
  hi: number,
): number {
  const max = Math.max(0, mapSize - view);
  const px = (p: number) => (p / 100) * mapSize;
  let at = px(focus) - view / 2;
  const first = px(hi) + EDGE_ROOM - view; // smallest offset that shows the last pin
  const last = px(lo) - EDGE_ROOM; // largest offset that shows the first pin
  if (first <= last) at = Math.min(Math.max(at, first), last);
  else at = (px(lo) + px(hi)) / 2 - view / 2;
  return Math.min(Math.max(at, 0), max);
}

export function useZoomPan(
  ratio: number,
  focus: { x: number; y: number },
  pins: PinBounds = { x0: focus.x, x1: focus.x, y0: focus.y, y1: focus.y },
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const keepCenter = useRef<{ x: number; y: number } | null>(null);
  const zoom = ZOOM_LEVELS[level] ?? 1;
  const base = size.w > 0 ? fitSize(size.w, size.h, ratio) : undefined;
  /** The map is bigger than the frame, so it can be dragged. */
  const pannable =
    base !== undefined && (base.width * zoom > size.w + 1 || base.height * zoom > size.h + 1);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () =>
      setSize((prev) =>
        prev.w === el.clientWidth && prev.h === el.clientHeight
          ? prev
          : { w: el.clientWidth, h: el.clientHeight },
      );
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When the frame gets its size (or changes size), show the focus point and the pins.
  const { x: fx, y: fy } = focus;
  const { x0, x1, y0, y1 } = pins;
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el || size.w === 0) return;
    el.scrollLeft = startScroll(el.scrollWidth, el.clientWidth, fx, x0, x1);
    el.scrollTop = startScroll(el.scrollHeight, el.clientHeight, fy, y0, y1);
  }, [size, fx, fy, x0, x1, y0, y1]);

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
      if (!el || !pannable || event.pointerType !== 'mouse' || event.button !== 0) return;
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
    /** Width of the map layer in px (undefined before the first measurement). */
    layerWidth: base ? base.width * zoom : undefined,
    pannable,
    canZoomIn: level < ZOOM_LEVELS.length - 1,
    canZoomOut: level > 0,
    zoomIn: () => zoomTo(level + 1),
    zoomOut: () => zoomTo(level - 1),
    compact: base !== undefined && base.width * zoom < COMPACT_WIDTH,
    handlers,
  };
}
