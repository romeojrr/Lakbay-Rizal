import { Link } from 'react-router-dom';
import type { Stop } from '../../content/schemas';
import type { MapStop } from '../../features/map/mapModel';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import Chip from '../Chip/Chip';
import { useEnterStop } from '../MapView/useEnterStop';
import Panel from '../Panel/Panel';
import styles from './StopCard.module.css';

interface StopCardProps {
  /** The first unfinished stop in this region, if any. */
  member: MapStop | undefined;
  regionLabel: string;
  /** The player's next stop when it is in another region. */
  nextElsewhere?: Stop;
}

/** "Next stop" card with scene thumbnail, theme chip, teaser and Enter button (FR-17). */
export default function StopCard({ member, regionLabel, nextElsewhere }: StopCardProps) {
  const enter = useEnterStop();
  if (!member) {
    return (
      <Panel className={styles.body}>
        <p className={styles.teaser}>{t('card.regionDone', { region: regionLabel })}</p>
      </Panel>
    );
  }

  const { stop, state } = member;
  const heading =
    state === 'current'
      ? stop.order === 1
        ? t('card.first')
        : t('card.now')
      : state === 'locked'
        ? t('card.comingUp')
        : t('card.next');

  return (
    <Panel>
      {stop.scene.image && (
        <img className={`pix ${styles.scene}`} src={asset(stop.scene.image)} alt={stop.scene.alt} />
      )}
      <div className={styles.body}>
        <div className={styles.top}>
          <span className={styles.kicker}>{heading}</span>
          <Chip theme={stop.theme} />
        </div>
        <h2 className={styles.title}>
          {t('card.title', { place: stop.place.label, year: stop.year })}
        </h2>
        <p className={styles.teaser}>{stop.teaser}</p>
        {state === 'locked' ? (
          <>
            <p className={styles.locked}>{t('map.lockedMessage')}</p>
            {nextElsewhere && (
              <Link className={styles.secondary} to={`/region/${nextElsewhere.region}`}>
                {t('card.goToNext', { place: nextElsewhere.place.label })}
              </Link>
            )}
          </>
        ) : (
          <Link
            className={styles.enter}
            to={`/stop/${stop.id}`}
            onClick={(event) => enter(event, stop.id, stop.region, member.point)}
          >
            {t('card.enter', { place: stop.place.label })}
          </Link>
        )}
      </div>
    </Panel>
  );
}
