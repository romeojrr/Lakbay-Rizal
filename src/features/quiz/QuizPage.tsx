import { Link, useParams } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import BackLink from '../../components/BackLink/BackLink';
import Panel from '../../components/Panel/Panel';
import { isUnlocked } from '../../content/selectors';
import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import styles from './QuizPage.module.css';
import QuizRun from './QuizRun';

/** /stop/:stopId/quiz — open only after the stop's dialogue is finished (FR-31). */
export default function QuizPage() {
  const { stopId } = useParams();
  const { content, stops } = useRootData();
  const mode = useProgress((s) => s.mode);
  const completed = useProgress((s) => s.completed);
  const visited = useProgress((s) => s.visited);
  const stop = stops.find((s) => s.id === stopId);

  if (
    !stop ||
    stop.status === 'outline' ||
    stop.quiz.length === 0 ||
    !isUnlocked(stop, stops, { completed }, mode)
  ) {
    return (
      <Panel className={styles.notice}>
        <h1 className={styles.noticeTitle}>{t('stop.notFoundTitle')}</h1>
        <BackLink fallback="/" label={t('stop.backToMap')} />
      </Panel>
    );
  }
  if (!visited.includes(stop.id)) {
    return (
      <Panel className={styles.notice}>
        <h1 className={styles.noticeTitle}>{t('quiz.finishStoryFirst')}</h1>
        <Link to={`/stop/${stop.id}`}>{t('quiz.goToStory')}</Link>
      </Panel>
    );
  }
  return <QuizRun key={stop.id} stop={stop} content={content} />;
}
