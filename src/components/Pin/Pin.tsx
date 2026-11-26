import { Link } from 'react-router-dom';
import type { PinGroup } from '../../features/map/mapModel';
import { cx } from '../../lib/cx';
import styles from './Pin.module.css';
import PinGlyph, { PIN_SIZE } from './PinGlyph';
import { useEnterStop } from '../MapView/useEnterStop';
import { pinColor, pinName } from './pinLook';

interface PinProps {
  /** Order on the map, for the staggered drop-in (§5.6). */
  index?: number;
  /** The traveller is arriving here: the pin pops (§5.6). */
  arriving?: boolean;
  group: PinGroup;
  /** Hide labels except on the current or highlighted pin (small maps). */
  compact: boolean;
  onLocked: () => void;
}

/** One stop on the map: a link when open, a button that explains the lock otherwise (FR-12, FR-13, FR-18). */
export default function Pin({ group, compact, onLocked, index = 0, arriving }: PinProps) {
  const { stop, state } = group.lead;
  const enter = useEnterStop();
  const big = state === 'current';
  const { h } = big ? PIN_SIZE.big : PIN_SIZE.small;
  const dot =
    state === 'locked' ? 'var(--pin-locked-dot)' : state === 'open' ? 'var(--ink)' : '#FFFFFF';
  const className = cx(
    styles.pin,
    styles[state],
    group.dimmed && styles.dimmed,
    group.highlighted && styles.highlighted,
    compact && styles.compact,
    arriving && styles.pop,
  );
  const style = {
    left: `calc(${group.point.x}% - 40px)`,
    top: `calc(${group.point.y}% - ${h}px)`,
    '--h': `${h}px`,
    '--i': index,
    '--pop-delay': arriving ? '1500ms' : '0ms',
  } as React.CSSProperties;
  const content = (
    <>
      {big && <span className={styles.glow} aria-hidden="true" />}
      <PinGlyph color={pinColor(stop, state)} dot={dot} big={big} />
      <span className={`pixel ${styles.label}`}>{state === 'locked' ? '?' : stop.place.label}</span>
    </>
  );

  if (state === 'locked') {
    return (
      <button
        type="button"
        className={className}
        style={style}
        aria-label={pinName(stop, state)}
        onClick={onLocked}
      >
        {content}
      </button>
    );
  }
  return (
    <Link
      to={`/stop/${stop.id}`}
      className={className}
      style={style}
      aria-label={pinName(stop, state)}
      data-guide={state === 'current' ? 'pin-current' : undefined}
      onClick={(event) => enter(event, stop.id, stop.region, group.point)}
    >
      {content}
    </Link>
  );
}
