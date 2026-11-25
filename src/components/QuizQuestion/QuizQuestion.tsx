import { forwardRef } from 'react';
import { asset } from '../../lib/asset';
import styles from './QuizQuestion.module.css';

interface QuizQuestionProps {
  prompt: string;
  sceneImage: string;
  stampIcon: string;
}

/** The question over the dimmed scene (Quiz.dc.html). The answers come below (FR-81). */
const QuizQuestion = forwardRef<HTMLParagraphElement, QuizQuestionProps>(function QuizQuestion(
  { prompt, sceneImage, stampIcon },
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
      </div>
    </div>
  );
});

export default QuizQuestion;
