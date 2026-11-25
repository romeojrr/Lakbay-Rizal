import { Link } from 'react-router-dom';
import type { MapStop } from '../../features/map/mapModel';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import { pinColor } from '../Pin/pinLook';
import styles from './StopRow.module.css';

interface StopRowProps {
  member: MapStop;
  onLocked: () => void;
}

/** One line in a stop list: color, year, place and status (mockup Journey list). */
export default function StopRow({ member, onLocked }: StopRowProps) {
  const { stop, state } = member;
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
        <Link className={styles.name} to={`/stop/${stop.id}`}>
          {stop.place.label}
        </Link>
      )}
      <span className={styles.status}>{t(`status.${state}`)}</span>
    </li>
  );
}
