import { NavLink } from 'react-router-dom';
import type { Region, RegionId } from '../../content/schemas';
import { t } from '../../i18n/t';
import styles from './RegionTabs.module.css';

interface RegionTabsProps {
  regions: readonly Pick<Region, 'id' | 'label'>[];
  /** Region of the player's next stop; its tab gets a small marker. */
  nextRegion?: RegionId;
}

export default function RegionTabs({ regions, nextRegion }: RegionTabsProps) {
  return (
    <nav aria-label={t('nav.regions')} className={styles.nav}>
      <ul className={styles.list}>
        {regions.map((region) => (
          <li key={region.id}>
            <NavLink
              to={`/region/${region.id}`}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.active}` : styles.tab
              }
              aria-label={
                region.id === nextRegion ? t('nav.nextHere', { region: region.label }) : undefined
              }
            >
              {region.label}
              {region.id === nextRegion && <span className={styles.marker} aria-hidden="true" />}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
