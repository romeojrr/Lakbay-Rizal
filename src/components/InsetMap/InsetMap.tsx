import { forwardRef } from 'react';
import type { Region } from '../../content/schemas';
import { clusterByDistance, leadOf, type PinGroup } from '../../features/map/mapModel';
import { asset } from '../../lib/asset';
import { projectToPercent } from '../../lib/projection';
import Panel from '../Panel/Panel';
import { pinColor } from '../Pin/pinLook';
import StopRow from '../StopRow/StopRow';
import styles from './InsetMap.module.css';

type Inset = NonNullable<Region['inset']>;

interface InsetMapProps {
  inset: Inset;
  group: PinGroup;
  onLocked: () => void;
}

/** Close-up of a crowded area, e.g. Manila and Laguna (FR-15). */
const InsetMap = forwardRef<HTMLDivElement, InsetMapProps>(function InsetMap(
  { inset, group, onLocked },
  ref,
) {
  const titleId = `${inset.id}-title`;
  const placed = group.members.map((m) => ({
    ...m,
    point: projectToPercent(m.stop.place.lat, m.stop.place.lon, inset),
  }));
  // One marker per town: stops in the same town overlap even on the close-up.
  const markers = clusterByDistance(placed, inset).map(leadOf);

  return (
    <Panel ref={ref} id={inset.id} tabIndex={-1} className={styles.card} aria-labelledby={titleId}>
      <div className={styles.map}>
        <img className={`pix ${styles.image}`} src={asset(inset.image)} alt="" />
        {markers.map((m) => (
          <span
            key={m.stop.id}
            className={styles.marker}
            style={{
              left: `calc(${m.point.x}% - 7px)`,
              top: `calc(${m.point.y}% - 7px)`,
              background: pinColor(m.stop, m.state),
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className={styles.list}>
        <h2 id={titleId} className={styles.title}>
          {inset.label}
        </h2>
        <ol className={styles.rows}>
          {group.members.map((m) => (
            <StopRow key={m.stop.id} member={m} onLocked={onLocked} />
          ))}
        </ol>
      </div>
    </Panel>
  );
});

export default InsetMap;
