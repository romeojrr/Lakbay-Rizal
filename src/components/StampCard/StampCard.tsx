import type { Stop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import styles from './StampCard.module.css';

// Small, repeatable tilts so the page looks hand-stamped (FR-51).
const TILTS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 0.5];

interface StampCardProps {
  stop: Stop;
  earned: boolean;
  isNew: boolean;
  /** The final stop's page: plain, untilted, never "New!" (GD-6). */
  plain: boolean;
}

/** One passport stamp: landmark icon, place and year, or "?" and the year if not earned. */
export default function StampCard({ stop, earned, isNew, plain }: StampCardProps) {
  const icon = stop.rewards.stamp.icon;
  if (!earned || !icon) {
    return (
      <li className={styles.locked}>
        <span className={styles.question} aria-hidden="true">
          ?
        </span>
        <span className={styles.lockedYear}>{stop.year}</span>
        <span className="visually-hidden">{t('passport.lockedStamp', { year: stop.year })}</span>
      </li>
    );
  }
  const tilt = plain ? 0 : (TILTS[(stop.order - 1) % TILTS.length] ?? 0);
  return (
    <li
      className={cx(styles.stamp, plain && styles.plain)}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className={styles.inner} style={{ borderColor: `var(--theme-${stop.theme})` }}>
        <img className="pix" src={asset(icon)} alt="" width={56} height={56} />
        <span className={styles.name} style={{ color: `var(--text-${stop.theme})` }}>
          {stop.place.label}
        </span>
        <span className={styles.year}>{stop.year}</span>
      </div>
      {isNew && !plain && <span className={styles.new}>{t('passport.new')}</span>}
    </li>
  );
}
