import { Link, useParams } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import BackLink from '../../components/BackLink/BackLink';
import Panel from '../../components/Panel/Panel';
import { getNextStop, isFinalStop, isUnlocked } from '../../content/selectors';
import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import styles from './StopPage.module.css';
import StopStory from './StopStory';

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Panel className={styles.notice}>
      <h1 className={styles.noticeTitle}>{title}</h1>
      {children}
    </Panel>
  );
}

/** /stop/:stopId — checks the stop exists and is open, then plays it (M3). */
export default function StopPage() {
  const { stopId } = useParams();
  const { content, stops, stories } = useRootData();
  const mode = useProgress((s) => s.mode);
  const completed = useProgress((s) => s.completed);
  const stop = stops.find((s) => s.id === stopId);

  if (!stop) {
    return (
      <Notice title={t('stop.notFoundTitle')}>
        <BackLink fallback="/" label={t('stop.backToMap')} />
      </Notice>
    );
  }
  if (stop.status === 'outline') {
    return (
      <Notice title={t('stop.comingSoonTitle')}>
        <BackLink fallback={`/region/${stop.region}`} label={t('stop.backToMap')} />
      </Notice>
    );
  }
  if (!isUnlocked(stop, stops, { completed }, mode)) {
    const next = getNextStop(stops, { completed });
    return (
      <Notice title={t('stop.lockedTitle')}>
        <p>{t('map.lockedMessage')}</p>
        {next && (
          <Link to={`/stop/${next.id}`}>{t('stop.goToNext', { place: next.place.label })}</Link>
        )}
      </Notice>
    );
  }
  const story = stories.find((s) => s.id === stop.id);
  if (!story || story.status === 'outline') {
    return (
      <Notice title={t('stop.comingSoonTitle')}>
        <BackLink fallback={`/region/${stop.region}`} label={t('stop.backToMap')} />
      </Notice>
    );
  }
  // key: each stop has its own player.
  return (
    <StopStory
      key={stop.id}
      stop={stop}
      story={story}
      content={content}
      isFinal={isFinalStop(stop, stops)}
    />
  );
}
