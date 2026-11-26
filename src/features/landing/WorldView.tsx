import { forwardRef, type CSSProperties } from 'react';
import type { Region, Stop } from '../../content/schemas';
import { asset } from '../../lib/asset';
import styles from './Landing.module.css';
import { pinPoints, routePaths, VIEW_H, worldPoint } from './world';

interface WorldViewProps {
  stops: readonly Stop[];
  regions: readonly Region[];
  /** Fading out for the fly-down. */
  leaving: boolean;
}

/** A region's label sits in the middle of its map's bounds. */
function labelPoint(region: Region) {
  return worldPoint((region.lat0 + region.lat1) / 2, (region.lon0 + region.lon1) / 2);
}

/**
 * U9: the whole world in pixel art, always filling the screen (a 16:9 box that covers the
 * viewport, so the overlay lines up), with the journey's pins and route from the content,
 * the four region names and a few drifting clouds. Purely decorative for screen readers:
 * the card says what it is.
 */
const WorldView = forwardRef<HTMLDivElement, WorldViewProps>(function WorldView(
  { stops, regions, leaving },
  ref,
) {
  const pins = pinPoints(stops);
  const paths = routePaths(stops);
  return (
    <div className={styles.world} aria-hidden="true">
      <div ref={ref} className={styles.camera}>
        <img className={`pix ${styles.map}`} src={asset('assets/maps/world.png')} alt="" />
        <svg className={styles.overlay} viewBox={`0 0 100 ${VIEW_H}`} preserveAspectRatio="none">
          {paths.map((d, i) => (
            <path key={i} d={d} className={styles.route} />
          ))}
        </svg>
        {pins.map((p, i) => (
          <span
            key={i}
            className={styles.pin}
            style={{ left: `${p.x}%`, top: `${p.y}%` } as CSSProperties}
          />
        ))}
        {regions.map((region) => {
          const p = labelPoint(region);
          return (
            <span
              key={region.id}
              className={`pixel ${styles.regionLabel} ${leaving ? styles.gone : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {region.label}
            </span>
          );
        })}
        {[0, 1, 2].map((i) => (
          <span key={i} className={`${styles.cloud} ${styles[`cloud${i}`]}`} />
        ))}
      </div>
    </div>
  );
});

export default WorldView;
