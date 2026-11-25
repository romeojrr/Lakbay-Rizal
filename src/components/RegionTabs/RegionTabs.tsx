import { NavLink } from 'react-router-dom';
import { t } from '../../i18n/t';
import styles from './RegionTabs.module.css';

// M0: fixed list. M1 reads the regions from public/content/regions.json.
const REGION_IDS = ['philippines', 'asia', 'europe', 'america'] as const;

export default function RegionTabs() {
  return (
    <nav aria-label={t('nav.regions')} className={styles.nav}>
      <ul className={styles.list}>
        {REGION_IDS.map((id) => (
          <li key={id}>
            <NavLink
              to={`/region/${id}`}
              className={({ isActive }) =>
                isActive ? `${styles.tab} ${styles.active}` : styles.tab
              }
            >
              {t(`regions.${id}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
