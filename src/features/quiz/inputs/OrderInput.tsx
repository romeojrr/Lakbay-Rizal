import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Question } from '../../../content/schemas';
import { t } from '../../../i18n/t';
import { cx } from '../../../lib/cx';
import type { InputProps } from './ChoiceInput';
import styles from './inputs.module.css';

type OrderQuestion = Extract<Question, { type: 'order' }>;
type Item = OrderQuestion['items'][number];

const move = (list: Item[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item) next.splice(to, 0, item);
  return next;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Pixels the pointer must move before a press on a row becomes a drag (else it is a tap). */
const DRAG_START = 6;
const SLIDE = 'transform 170ms cubic-bezier(0.2, 0.8, 0.2, 1)';

interface Drag {
  pointerId: number;
  from: number;
  to: number;
  startY: number;
  /** Distance from one row's top to the next one's. */
  pitch: number;
  active: boolean;
}

/**
 * `order` (FR-81): drag a row (by its grip or anywhere on it, mouse or touch) — it follows the
 * pointer and the other rows slide out of its way; or tap one row, then another, to swap them;
 * or pick a row (Enter / Space) and move it with the arrow keys. Then Check.
 * The drag moves the rows with transforms only (no re-render per move), so it keeps up with the
 * pointer at full frame rate; the order changes once, when the row is let go.
 */
export default function OrderInput({ question, status, onAnswer }: InputProps<OrderQuestion>) {
  const [items, setItems] = useState(question.items);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<Drag | null>(null);
  /** After a drop: the dropped row eases from where it was let go into its slot. */
  const settle = useRef<{ id: string; offset: number } | null>(null);
  /** A drag just ended on a row: its click must not count as a tap. */
  const suppressTap = useRef(false);
  const locked = status !== 'answering';
  const total = items.length;

  const rows = () => [...(listRef.current?.children ?? [])] as HTMLElement[];

  const announce = (item: Item | undefined, to: number) =>
    item && setAnnouncement(t('quiz.moved', { text: item.text, n: to + 1, total }));

  const tap = (index: number) => {
    if (suppressTap.current) {
      suppressTap.current = false;
      return;
    }
    if (selected === null) return setSelected(index);
    if (selected !== index) {
      const next = [...items];
      [next[selected], next[index]] = [next[index] as Item, next[selected] as Item];
      setItems(next);
      announce(next[index], index);
    }
    setSelected(null);
  };

  const onKey = (event: KeyboardEvent, index: number) => {
    if (selected !== index) return;
    const to = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : -1;
    if (to < 0 || to >= total) return;
    event.preventDefault();
    const next = move(items, index, to);
    setItems(next);
    setSelected(to);
    announce(next[to], to);
    requestAnimationFrame(() => buttons.current[to]?.focus());
  };

  const onPointerDown = (event: PointerEvent<HTMLLIElement>, index: number) => {
    if (locked || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const list = rows();
    const first = list[0]?.getBoundingClientRect();
    const second = list[1]?.getBoundingClientRect();
    const pitch = first && second ? second.top - first.top : 60;
    drag.current = {
      pointerId: event.pointerId,
      from: index,
      to: index,
      startY: event.clientY,
      pitch,
      active: false,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    const dy = event.clientY - d.startY;
    const list = rows();
    if (!d.active) {
      if (Math.abs(dy) < DRAG_START) return;
      d.active = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setSelected(null);
      setDragging(d.from);
      list.forEach((row, i) => (row.style.transition = i === d.from ? 'none' : SLIDE));
    }
    const to = clamp(Math.round(d.from + dy / d.pitch), 0, list.length - 1);
    d.to = to;
    list.forEach((row, i) => {
      if (i === d.from) row.style.transform = `translateY(${dy}px) scale(1.02)`;
      else if (d.from < i && i <= to) row.style.transform = `translateY(${-d.pitch}px)`;
      else if (to <= i && i < d.from) row.style.transform = `translateY(${d.pitch}px)`;
      else row.style.transform = '';
    });
  };

  const endDrag = (event: PointerEvent<HTMLLIElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.pointerId) return;
    drag.current = null;
    if (!d.active) return; // a plain press: the click (tap) handles it
    suppressTap.current = true;
    setTimeout(() => (suppressTap.current = false), 0);
    const dy = event.clientY - d.startY;
    rows().forEach((row) => {
      row.style.transition = 'none';
      row.style.transform = '';
    });
    setDragging(null);
    const item = items[d.from];
    if (item) settle.current = { id: item.id, offset: dy - (d.to - d.from) * d.pitch };
    if (d.to !== d.from) {
      const next = move(items, d.from, d.to);
      setItems(next);
      announce(next[d.to], d.to);
    } else {
      setItems([...items]); // runs the settle below
    }
  };

  // The dropped row eases into its slot from where it was let go.
  useLayoutEffect(() => {
    const s = settle.current;
    settle.current = null;
    const list = rows();
    if (!s) return;
    const row = list.find((el) => el.dataset.id === s.id);
    if (row && Math.abs(s.offset) > 0.5) {
      row.style.transition = 'none';
      row.style.transform = `translateY(${s.offset}px)`;
      void row.offsetHeight; // apply before easing back
      row.style.transition = SLIDE;
      row.style.transform = '';
    }
    list.forEach((el) => {
      if (el !== row) el.style.transition = '';
    });
  }, [items]);

  return (
    <div className={styles.stack}>
      <p className={styles.help}>{t('quiz.orderHelp')}</p>
      <ol ref={listRef} className={styles.rows} aria-labelledby="quiz-prompt">
        {items.map((item, index) => (
          <li
            key={item.id}
            data-id={item.id}
            className={cx(styles.row, dragging === index && styles.dragging)}
            onPointerDown={(event) => onPointerDown(event, index)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className={styles.grip} aria-hidden="true">
              ⠿
            </span>
            <button
              ref={(el) => {
                buttons.current[index] = el;
              }}
              type="button"
              className={cx(styles.option, status === 'right' && styles.right)}
              aria-pressed={selected === index}
              disabled={locked}
              onClick={() => tap(index)}
              onKeyDown={(event) => onKey(event, index)}
            >
              <span className={styles.mark} aria-hidden="true">
                {status === 'right' ? '✓' : index + 1}
              </span>
              <span>{item.text}</span>
              <span className="visually-hidden">
                , {t('quiz.position', { n: index + 1, total })}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
      {!locked && (
        <button
          type="button"
          className={styles.check}
          onClick={() => onAnswer({ type: 'order', order: items.map((i) => i.id) })}
        >
          {t('quiz.check')}
        </button>
      )}
    </div>
  );
}
