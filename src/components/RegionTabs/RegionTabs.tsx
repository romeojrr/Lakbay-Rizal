import { NavLink } from 'react-router-dom';
import type { Region } from '../../content/schemas';
import { t } from '../../i18n/t';
import styles from './RegionTabs.module.css';

interface RegionTabsProps {
  regions: readonly Pick<Region, 'id' | 'label'>[];
}

export default function RegionTabs({ regions }: RegionTabsProps) {
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
            >
              {region.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
