import { Link } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import BackLink from '../../components/BackLink/BackLink';
import Panel from '../../components/Panel/Panel';
import { isUnlocked } from '../../content/selectors';
import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import BuilderRun from './BuilderRun';
import styles from './BuilderPage.module.css';

/** /dapitan/build — opens after the Dapitan story is finished (SRS §3.5, FR-2). */
export default function BuilderPage() {
  const { content, stops } = useRootData();
  const mode = useProgress((s) => s.mode);
  const completed = useProgress((s) => s.completed);
  const visited = useProgress((s) => s.visited);
  const stop = stops.find((s) => s.builder);

  if (!stop || stop.status === 'outline' || !isUnlocked(stop, stops, { completed }, mode)) {
    return (
      <Panel className={styles.notice}>
        <h1 className={styles.noticeTitle}>{t('builder.notHere')}</h1>
        <BackLink fallback="/" label={t('stop.backToMap')} />
      </Panel>
    );
  }
  if (!visited.includes(stop.id)) {
    return (
      <Panel className={styles.notice}>
        <h1 className={styles.noticeTitle}>{t('builder.finishStoryFirst')}</h1>
        <Link to={`/stop/${stop.id}`}>{t('builder.goToStory')}</Link>
      </Panel>
    );
  }
  return <BuilderRun stop={stop} content={content} />;
}
