import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './SidePanel.module.css';

type SheetSize = 'peek' | 'half' | 'full';
const SIZES: SheetSize[] = ['peek', 'half', 'full'];
const DRAG_THRESHOLD = 6;

interface SidePanelProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  children: ReactNode;
}

/**
 * Map side panel (SRS v2.3 §5.5). Desktop: 340 px column that folds to a 48 px rail.
 * Phones: a bottom sheet with a drag handle and three heights; tapping the handle (or
 * pressing it with the keyboard) steps through them.
 */
export default function SidePanel({ collapsed, onToggleCollapsed, children }: SidePanelProps) {
  const [size, setSize] = useState<SheetSize>('peek');
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; height: number; moved: boolean } | null>(null);

  const snapHeights = (): Record<SheetSize, number> => ({
    peek: 132,
    half: window.innerHeight * 0.5,
    full: window.innerHeight * 0.85,
  });

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    drag.current = { y: event.clientY, height: panel.offsetHeight, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - event.clientY;
    if (Math.abs(dy) > DRAG_THRESHOLD) d.moved = true;
    if (d.moved) setDragHeight(Math.max(96, d.height + dy));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved || dragHeight === null) return;
    const heights = snapHeights();
    const nearest = SIZES.reduce((best, s) =>
      Math.abs(heights[s] - dragHeight) < Math.abs(heights[best] - dragHeight) ? s : best,
    );
    setSize(nearest);
    setDragHeight(null);
  };

  const onHandleClick = () => {
    if (drag.current?.moved) return;
    setSize(SIZES[(SIZES.indexOf(size) + 1) % SIZES.length] ?? 'peek');
  };

  return (
    <aside
      ref={panelRef}
      className={cx(styles.panel, collapsed && styles.collapsed, styles[size])}
      style={dragHeight !== null ? { height: dragHeight } : undefined}
      aria-label={t('panel.label')}
    >
      <button
        type="button"
        className={styles.handle}
        aria-label={`${t('panel.resize')}. ${t(`panel.${size}`)}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onHandleClick}
      >
        <span className={styles.grip} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.collapse}
        aria-expanded={!collapsed}
        aria-controls="side-panel-content"
        onClick={onToggleCollapsed}
      >
        <span aria-hidden="true">{collapsed ? '◀' : '▶'}</span>
        <span className="visually-hidden">{collapsed ? t('panel.show') : t('panel.hide')}</span>
      </button>
      <div id="side-panel-content" className={styles.content}>
        {children}
      </div>
    </aside>
  );
}
