import { useState } from 'react';
import type { Question } from '../../../content/schemas';
import { t } from '../../../i18n/t';
import { cx } from '../../../lib/cx';
import type { InputProps } from './ChoiceInput';
import styles from './inputs.module.css';

type MatchQuestion = Extract<Question, { type: 'match' }>;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * `match` (FR-81): tap (or press Enter on) a name on the left, then its match on the right.
 * Either side can go first; pairing a taken item moves it. Check once every name has a match.
 */
export default function MatchInput({ question, status, onAnswer }: InputProps<MatchQuestion>) {
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<{ side: 'left' | 'right'; id: string } | null>(null);
  const locked = status !== 'answering';
  const letterOf = (rightId: string) => LETTERS[question.right.findIndex((r) => r.id === rightId)];
  const textOf = (rightId: string) => question.right.find((r) => r.id === rightId)?.text ?? '';
  const leftOf = (rightId: string) => Object.keys(pairs).find((l) => pairs[l] === rightId);

  const link = (left: string, right: string) => {
    const next = Object.fromEntries(Object.entries(pairs).filter(([, r]) => r !== right));
    next[left] = right;
    setPairs(next);
    setPicked(null);
  };

  const tap = (side: 'left' | 'right', id: string) => {
    if (!picked || picked.side === side) {
      setPicked(picked?.id === id ? null : { side, id });
      return;
    }
    if (side === 'left') link(id, picked.id);
    else link(picked.id, id);
  };

  const complete = Object.keys(pairs).length === question.left.length;

  return (
    <div className={styles.stack}>
      <div className={styles.columns}>
        <ul className={styles.column} aria-label={t('quiz.matchLeft')}>
          {question.left.map((item) => {
            const right = pairs[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cx(styles.option, status === 'right' && styles.right)}
                  aria-pressed={picked?.side === 'left' && picked.id === item.id}
                  disabled={locked}
                  onClick={() => tap('left', item.id)}
                >
                  <span>{item.text}</span>
                  {right && (
                    <span className={styles.pair} aria-hidden="true">
                      {letterOf(right)}
                    </span>
                  )}
                  <span className="visually-hidden">
                    ,{' '}
                    {right ? t('quiz.matchedWith', { text: textOf(right) }) : t('quiz.notMatched')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <ul className={styles.column} aria-label={t('quiz.matchRight')}>
          {question.right.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className={cx(
                  styles.option,
                  status === 'right' && styles.right,
                  leftOf(item.id) && styles.taken,
                )}
                aria-pressed={picked?.side === 'right' && picked.id === item.id}
                disabled={locked}
                onClick={() => tap('right', item.id)}
              >
                <span className={styles.mark} aria-hidden="true">
                  {LETTERS[i]}
                </span>
                <span>{item.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {!locked && (
        <button
          type="button"
          className={styles.check}
          disabled={!complete}
          onClick={() => onAnswer({ type: 'match', pairs })}
        >
          {t('quiz.check')}
        </button>
      )}
    </div>
  );
}
