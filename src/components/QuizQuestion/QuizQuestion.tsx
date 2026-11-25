import { forwardRef, type ReactNode } from 'react';
import { asset } from '../../lib/asset';
import styles from './QuizQuestion.module.css';

interface QuizQuestionProps {
  prompt: string;
  sceneImage: string;
  stampIcon: string;
  /** The answers and feedback, inside the same card. */
  children?: ReactNode;
}

/** The quiz card, centred over a dimmed copy of the scene (Quiz.dc.html, v2.2 layout). */
const QuizQuestion = forwardRef<HTMLParagraphElement, QuizQuestionProps>(function QuizQuestion(
  { prompt, sceneImage, stampIcon, children },
  ref,
) {
  return (
    <div className={styles.stage}>
      <img className={`pix ${styles.scene}`} src={asset(sceneImage)} alt="" />
      <div className={styles.card}>
        <img className="pix" src={asset(stampIcon)} alt="" width={52} height={52} />
        <p ref={ref} id="quiz-prompt" className={styles.prompt} tabIndex={-1}>
          {prompt}
        </p>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
});

export default QuizQuestion;
