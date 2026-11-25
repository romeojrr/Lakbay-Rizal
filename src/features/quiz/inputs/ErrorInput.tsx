import { useState } from 'react';
import type { Question } from '../../../content/schemas';
import { t } from '../../../i18n/t';
import { cx } from '../../../lib/cx';
import type { InputProps } from './ChoiceInput';
import styles from './inputs.module.css';

type ErrorQuestion = Extract<Question, { type: 'error' }>;

/**
 * `error` (FR-81): the statement in parts; tap the part that is wrong. Once found, the
 * correction is shown under it.
 */
export default function ErrorInput({ question, status, onAnswer }: InputProps<ErrorQuestion>) {
  const [picked, setPicked] = useState<string | null>(null);
  const locked = status !== 'answering';
  return (
    <div className={styles.stack}>
      <p className={styles.sentence} role="group" aria-labelledby="quiz-prompt">
        {question.segments.map((segment) => {
          const right = status === 'right' && segment.id === question.answer;
          const wrong = status === 'wrong' && segment.id === picked;
          return (
            <button
              key={segment.id}
              type="button"
              className={cx(styles.segment, right && styles.right, wrong && styles.wrong)}
              disabled={locked}
              onClick={() => {
                setPicked(segment.id);
                onAnswer({ type: 'error', pick: segment.id });
              }}
            >
              {right && <span aria-hidden="true">✓ </span>}
              {segment.text}
              {right && <span className="visually-hidden">, {t('quiz.errorFound')}</span>}
              {wrong && <span className="visually-hidden">, {t('quiz.wrongMark')}</span>}
            </button>
          );
        })}
      </p>
      {status === 'right' && (
        <p className={styles.help}>
          {t('quiz.correctionLine', { label: t('quiz.correction'), text: question.correction })}
        </p>
      )}
    </div>
  );
}
