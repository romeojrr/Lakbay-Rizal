import { THEMES } from '../../content/constants';
import type { Region } from '../../content/schemas';
import { t } from '../../i18n/t';
import styles from './MapView.module.css';

interface MapOverlaysProps {
  region: Region;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Region name + years (top left), theme legend (bottom left), zoom buttons (bottom right). FR-16. */
export default function MapOverlays({
  region,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: MapOverlaysProps) {
  return (
    <>
      <div className={styles.titleBox}>
        <h1 className={styles.regionName}>{region.label}</h1>
        <span className={styles.years}>{region.years}</span>
      </div>
      <ul className={styles.legend} aria-label={t('map.legend')}>
        {THEMES.map((theme) => (
          <li key={theme} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ background: `var(--theme-${theme})` }}
              aria-hidden="true"
            />
            {t(`themes.${theme}`)}
          </li>
        ))}
      </ul>
      <div className={styles.zoom}>
        <button
          type="button"
          className={styles.zoomButton}
          aria-label={t('map.zoomIn')}
          disabled={!canZoomIn}
          onClick={onZoomIn}
        >
          +
        </button>
        <button
          type="button"
          className={styles.zoomButton}
          aria-label={t('map.zoomOut')}
          disabled={!canZoomOut}
          onClick={onZoomOut}
        >
          –
        </button>
      </div>
    </>
  );
}
