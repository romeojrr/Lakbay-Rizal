import { Link } from 'react-router-dom';
import Panel from '../../components/Panel/Panel';
import type { PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import styles from './StopPage.module.css';

interface StopActionsProps {
  stop: PlayableStop;
  finished: boolean;
  isFinal: boolean;
  onReadMore: () => void;
}

/** Under the scene: Read more, Quiz ▶ (or Build the town ▶), and the quiet Epilogue (GD-6). */
export default function StopActions({ stop, finished, isFinal, onReadMore }: StopActionsProps) {
  const hasQuiz = stop.quiz.length > 0;
  return (
    <>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onReadMore}>
          {t('stop.readMore')}
        </button>
        {hasQuiz &&
          (finished ? (
            <Link
              className={stop.builder ? styles.secondary : styles.primary}
              to={`/stop/${stop.id}/quiz`}
              data-guide="quiz-button"
            >
              {t('stop.quiz')}
            </Link>
          ) : (
            <span className={styles.disabled} aria-disabled="true" data-guide="quiz-button">
              {t('stop.quiz')}
              <span className="visually-hidden"> {t('stop.quizLockedHint')}</span>
            </span>
          ))}
        {stop.builder && finished && (
          // §3.5: the Dapitan builder opens after the dialogue.
          <Link className={styles.primary} to="/dapitan/build">
            {t('stop.builder')}
          </Link>
        )}
      </div>
      {!hasQuiz && isFinal && finished && (
        // GD-6: a quiet close, no quiz and no celebration.
        <Panel className={styles.epilogue} aria-labelledby="epilogue-title">
          <h2 id="epilogue-title" className={styles.cardTitle}>
            {t('stop.epilogueTitle')}
          </h2>
          <p className={styles.epilogueText}>{t('stop.epilogueBody')}</p>
          <div className={styles.epilogueLinks}>
            <Link to={`/region/${stop.region}`}>{t('stop.epilogueTimeline')}</Link>
            <Link to="/credits">{t('stop.epilogueCredits')}</Link>
          </div>
        </Panel>
      )}
    </>
  );
}
