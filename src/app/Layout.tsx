import { Link, Outlet } from 'react-router-dom';
import RegionTabs from '../components/RegionTabs/RegionTabs';
import { t } from '../i18n/t';
import { asset } from '../lib/asset';
import styles from './Layout.module.css';

// M0 placeholder: M1 replaces these with progress + the number of stops in content.
const STAMPS_EARNED = 0;
const STOPS_TOTAL = 25;

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
          <RegionTabs />
          <div className={styles.actions}>
            <Link to="/scenes" className={styles.navLink}>
              {t('nav.scenes')}
            </Link>
            <Link to="/passport" className={`${styles.navLink} ${styles.passport}`}>
              <PassportIcon />
              {t('nav.passport', { done: STAMPS_EARNED, total: STOPS_TOTAL })}
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
