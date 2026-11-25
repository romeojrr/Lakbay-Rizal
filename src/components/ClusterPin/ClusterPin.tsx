import { groupLabel, type PinGroup } from '../../features/map/mapModel';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from '../Pin/Pin.module.css';
import { pinColor } from '../Pin/pinLook';

interface ClusterPinProps {
  group: PinGroup;
  /** Label for an inset cluster, e.g. "Manila area". */
  insetLabel?: string;
  compact: boolean;
  expanded: boolean;
  controls: string;
  onActivate: () => void;
}

/** Several stops that would overlap, shown as one square with a count (FR-15). */
export default function ClusterPin({
  group,
  insetLabel,
  compact,
  expanded,
  controls,
  onActivate,
}: ClusterPinProps) {
  const { stop, state } = group.lead;
  const allLocked = group.members.every((m) => m.state === 'locked');
  const count = group.members.length;
  const place = insetLabel ?? groupLabel(group);
  // A locked group shows "?" instead of its places. The name contains the visible text in
  // reading order ("2" then the label), so speech-control users can say it (WCAG 2.5.3).
  const hidePlace = allLocked && !insetLabel;
  const name = hidePlace
    ? t('pin.lockedCluster', { count })
    : t(group.kind === 'inset' ? 'pin.inset' : 'pin.cluster', { count, place });
  const size = state === 'current' ? 36 : 30;

  return (
    <button
      type="button"
      className={cx(
        styles.pin,
        styles[allLocked ? 'locked' : state],
        group.dimmed && styles.dimmed,
        group.highlighted && styles.highlighted,
        compact && styles.compact,
      )}
      style={{
        left: `calc(${group.point.x}% - 40px)`,
        top: `calc(${group.point.y}% - ${size}px)`,
      }}
      aria-label={name}
      aria-expanded={group.kind === 'cluster' ? expanded : undefined}
      aria-controls={controls}
      onClick={onActivate}
    >
      <span
        className={styles.count}
        style={{ background: pinColor(stop, allLocked ? 'locked' : state) }}
      >
        {count}
      </span>{' '}
      {/* The space keeps the visible text "2 Paris" matching the name "2 Paris stops". */}
      <span className={styles.label}>{hidePlace ? '?' : place}</span>
    </button>
  );
}
