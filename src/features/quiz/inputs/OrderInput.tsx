import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
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

/**
 * `order` (FR-81): drag a row by its grip (mouse or touch); or tap one row, then another, to
 * swap them; or pick a row (Enter / Space) and move it with the arrow keys. Then Check.
 */
export default function OrderInput({ question, status, onAnswer }: InputProps<OrderQuestion>) {
  const [items, setItems] = useState(question.items);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const listRef = useRef<HTMLOListElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const locked = status !== 'answering';
  const total = items.length;

  const announce = (item: Item | undefined, to: number) =>
    item && setAnnouncement(t('quiz.moved', { text: item.text, n: to + 1, total }));

  const tap = (index: number) => {
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

  // Dragging: the row follows the pointer over the other rows.
  const onPointerMove = (event: PointerEvent) => {
    if (dragging === null) return;
    const rows = [...(listRef.current?.children ?? [])];
    const over = rows.findIndex((row) => {
      const box = row.getBoundingClientRect();
      return event.clientY >= box.top && event.clientY <= box.bottom;
    });
    if (over >= 0 && over !== dragging) {
      setItems(move(items, dragging, over));
      setDragging(over);
    }
  };
  const endDrag = () => {
    if (dragging !== null) announce(items[dragging], dragging);
    setDragging(null);
  };

  return (
    <div className={styles.stack}>
      <p className={styles.help}>{t('quiz.orderHelp')}</p>
      <ol ref={listRef} className={styles.rows} aria-labelledby="quiz-prompt">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={cx(styles.row, dragging === index && styles.dragging)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span
              className={styles.grip}
              aria-hidden="true"
              onPointerDown={(event) => {
                if (locked) return;
                event.currentTarget.setPointerCapture?.(event.pointerId);
                setSelected(null);
                setDragging(index);
              }}
            >
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
