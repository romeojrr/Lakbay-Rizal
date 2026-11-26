import { Link } from 'react-router-dom';
import type { MapStop } from '../../features/map/mapModel';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import { useEnterStop } from '../MapView/useEnterStop';
import { pinColor } from '../Pin/pinLook';
import styles from './StopRow.module.css';

interface StopRowProps {
  member: MapStop;
  onLocked: () => void;
}

/** One line in a stop list: color, year, place and status (mockup Journey list). */
export default function StopRow({ member, onLocked }: StopRowProps) {
  const { stop, state } = member;
  const enter = useEnterStop(); // zoom in on the place first, as the map card's Enter does
  return (
    <li className={cx(styles.row, styles[state])}>
      <span
        className={styles.swatch}
        style={{ background: pinColor(stop, state) }}
        aria-hidden="true"
      />
      <span className={styles.year}>{stop.year}</span>
      {state === 'locked' ? (
        <button type="button" className={styles.name} onClick={onLocked}>
          {stop.place.label}
        </button>
      ) : (
        <Link
          className={styles.name}
          to={`/stop/${stop.id}`}
          onClick={(event) => enter(event, stop.id, stop.region, member.point)}
        >
          {stop.place.label}
        </Link>
      )}
      <span className={styles.status}>{t(`status.${state}`)}</span>
    </li>
  );
}
