import { useState } from 'react';
import type { Question } from '../../../content/schemas';
import { t } from '../../../i18n/t';
import { cx } from '../../../lib/cx';
import type { Answer } from '../quizModel';
import styles from './inputs.module.css';

export type Status = 'answering' | 'wrong' | 'right';

export interface InputProps<Q> {
  /** Already shuffled for this attempt. */
  question: Q;
  status: Status;
  onAnswer: (answer: Answer) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

type ChoiceQuestion = Extract<Question, { type: 'mcq' | 'multi' }>;

/**
 * `mcq`: one tap answers. `multi`: tap every right option, then Check (FR-81).
 * Right answers turn green with ✓, a wrong pick light red with ✗ (FR-41).
 */
export default function ChoiceInput({ question, status, onAnswer }: InputProps<ChoiceQuestion>) {
  const multi = question.type === 'multi';
  const [picked, setPicked] = useState<string[]>([]);
  const answers = question.type === 'multi' ? question.answers : [question.answer];
  const locked = status !== 'answering';

  const pick = (id: string) => {
    if (!multi) {
      setPicked([id]);
      onAnswer({ type: 'mcq', pick: id });
      return;
    }
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  return (
    <div className={styles.stack}>
      <div className={styles.list} role="group" aria-labelledby="quiz-prompt">
        {question.options.map((option, i) => {
          const chosen = picked.includes(option.id);
          const right = status === 'right' && answers.includes(option.id);
          const wrong = status === 'wrong' && chosen && !answers.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={cx(styles.option, right && styles.right, wrong && styles.wrong)}
              aria-pressed={multi ? chosen : undefined}
              disabled={locked}
              onClick={() => pick(option.id)}
            >
              <span className={styles.mark} aria-hidden="true">
                {right ? '✓' : wrong ? '✗' : LETTERS[i]}
              </span>
              <span>{option.text}</span>
              {right && <span className="visually-hidden">, {t('quiz.rightMark')}</span>}
              {wrong && <span className="visually-hidden">, {t('quiz.wrongMark')}</span>}
            </button>
          );
        })}
      </div>
      {multi && status === 'answering' && (
        <button
          type="button"
          className={styles.check}
          disabled={picked.length === 0}
          onClick={() => onAnswer({ type: 'multi', picks: picked })}
        >
          {t('quiz.check')}
        </button>
      )}
    </div>
  );
}
