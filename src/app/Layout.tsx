import { Link, Outlet } from 'react-router-dom';
import RegionTabs from '../components/RegionTabs/RegionTabs';
import { t } from '../i18n/t';
import { asset } from '../lib/asset';
import styles from './Layout.module.css';
import { useRootData } from './useRootData';

// Placeholder until the progress store arrives in M4.
const STAMPS_EARNED = 0;

function PassportIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="0" width="6" height="8" fill="var(--ink)" />
      <rect x="3" y="2" width="2" height="2" fill="var(--gold)" />
      <rect x="2" y="5" width="4" height="1" fill="var(--gold)" />
    </svg>
  );
}

export default function Layout() {
  const { content, stops } = useRootData();
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <img
              className={`pix ${styles.logoSprite}`}
              src={asset('assets/sprites/rizal_adult_suit.png')}
              alt=""
              width={24}
              height={55}
            />
            <span className={styles.logoText}>{t('app.logo')}</span>
          </Link>
          <RegionTabs regions={content.regions} />
          <div className={styles.actions}>
            <Link to="/scenes" className={styles.navLink}>
              {t('nav.scenes')}
            </Link>
            <Link to="/passport" className={`${styles.navLink} ${styles.passport}`}>
              <PassportIcon />
              {t('nav.passport', { done: STAMPS_EARNED, total: stops.length })}
            </Link>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}
