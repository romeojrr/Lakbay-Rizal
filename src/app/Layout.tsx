import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import RegionTabs from '../components/RegionTabs/RegionTabs';
import Toast from '../components/Toast/Toast';
import { t } from '../i18n/t';
import { asset } from '../lib/asset';
import { consumeLoadProblem, useProgress } from '../store/progress';
import styles from './Layout.module.css';
import { useRootData } from './useRootData';

const NOTICE_MS = 6000;

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
  const stamps = useProgress((s) => s.stamps);
  const earned = stops.filter((s) => stamps.includes(s.id)).length;
  // §8.5: tell the player once if their saved progress could not be read.
  const [notice, setNotice] = useState(() =>
    consumeLoadProblem() ? t('progress.resetNotice') : null,
  );
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // FR-71: text size and reduce motion apply to the whole page (see global.css).
  const { textSize, reduceMotion } = useProgress((s) => s.settings);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.dataset.motion = reduceMotion;
  }, [textSize, reduceMotion]);

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
              {t('nav.passport', { done: earned, total: stops.length })}
            </Link>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <nav aria-label={t('footer.label')} className={styles.footerNav}>
          <Link to="/settings">{t('footer.settings')}</Link>
          <Link to="/credits">{t('footer.credits')}</Link>
        </nav>
      </footer>
      {notice && <Toast message={notice} />}
    </>
  );
}
