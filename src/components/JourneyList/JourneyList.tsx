import type { MapStop } from '../../features/map/mapModel';
import { t } from '../../i18n/t';
import Panel from '../Panel/Panel';
import StopRow from '../StopRow/StopRow';
import styles from './JourneyList.module.css';

interface JourneyListProps {
  members: readonly MapStop[];
  onLocked: () => void;
}

/** Every stop in the region with its status; the current stop is highlighted (FR-17). */
export default function JourneyList({ members, onLocked }: JourneyListProps) {
  return (
    <Panel className={styles.panel} aria-labelledby="journey-title">
      <h2 id="journey-title" className={styles.title}>
        {t('journey.title')}
      </h2>
      <ol className={styles.rows}>
        {members.map((m) => (
          <StopRow key={m.stop.id} member={m} onLocked={onLocked} />
        ))}
      </ol>
    </Panel>
  );
}
