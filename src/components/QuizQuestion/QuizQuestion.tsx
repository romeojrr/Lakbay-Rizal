import { forwardRef } from 'react';
import type { PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import styles from './QuizQuestion.module.css';

type Question = PlayableStop['quiz'][number];

interface QuizQuestionProps {
  question: Question;
  /** Option id the player picked, or null. */
  picked: string | null;
  sceneImage: string;
  stampIcon: string;
  onPick: (optionId: string) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * One question over the dimmed scene, with four answer buttons (FR-40, FR-41).
 * After a pick, the right answer turns dark green with ✓ and a wrong pick light red with ✗:
 * they differ in lightness, not only hue, and the marks carry the meaning too.
 */
const QuizQuestion = forwardRef<HTMLParagraphElement, QuizQuestionProps>(function QuizQuestion(
  { question, picked, sceneImage, stampIcon, onPick },
  ref,
) {
  return (
    <>
      <div className={styles.stage}>
        <img className={`pix ${styles.scene}`} src={asset(sceneImage)} alt="" />
        <div className={styles.card}>
          <img className="pix" src={asset(stampIcon)} alt="" width={52} height={52} />
          <p ref={ref} id="quiz-prompt" className={styles.prompt} tabIndex={-1}>
            {question.prompt}
          </p>
        </div>
      </div>
      <div className={styles.options} role="group" aria-labelledby="quiz-prompt">
        {question.options.map((option, i) => {
          const isRight = picked !== null && option.id === question.answer;
          const isWrong = picked === option.id && option.id !== question.answer;
          return (
            <button
              key={option.id}
              type="button"
              className={cx(styles.option, isRight && styles.right, isWrong && styles.wrong)}
              disabled={picked !== null}
              onClick={() => onPick(option.id)}
            >
              <span className={styles.mark} aria-hidden="true">
                {isRight ? '✓' : isWrong ? '✗' : LETTERS[i]}
              </span>
              <span>{option.text}</span>
              {isRight && <span className="visually-hidden">, {t('quiz.rightMark')}</span>}
              {isWrong && <span className="visually-hidden">, {t('quiz.wrongMark')}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
});

export default QuizQuestion;
