import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav/BottomNav';
import Celebrations from '../components/Celebrations/Celebrations';
import TipBubble from '../features/guide/TipBubble';
import Tour from '../features/guide/Tour';
import SaveGuard from '../features/save/SaveGuard';
import Toast from '../components/Toast/Toast';
import TopBar from '../components/TopBar/TopBar';
import { getNextStop } from '../content/selectors';
import { t } from '../i18n/t';
import { consumeLoadProblem, useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import styles from './Layout.module.css';
import { useRootData } from './useRootData';

const NOTICE_MS = 6000;

/** App shell (SRS v2.3 §5.5): slim top bar, page, footer (desktop) or bottom navigation (phones). */
export default function Layout() {
  const { content, stops } = useRootData();
  const stamps = useProgress((s) => s.stamps);
  const completed = useProgress((s) => s.completed);
  const lastRegion = useUi((s) => s.lastRegion);
  const nextRegion = getNextStop(stops, { completed })?.region;
  const earned = stops.filter((s) => stamps.includes(s.id)).length;
  const mapRegion = lastRegion ?? nextRegion ?? content.regions[0]?.id ?? 'philippines';

  // §8.5: tell the player once if their saved progress could not be read.
  const [notice, setNotice] = useState(() =>
    consumeLoadProblem() ? t('progress.resetNotice') : null,
  );
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  // §3.7 / FR-4: the tour runs when a first visit opens (players who saw the v2.2 intro can
  // replay it from Settings). Checked once, when the game opens: a progress reset does not
  // start it mid-visit. Never on the final stop (GD-6).
  const { pathname } = useLocation();
  const [openedOn] = useState(pathname);
  useEffect(() => {
    const { tourDone, seenIntro } = useProgress.getState();
    const ui = useUi.getState();
    if (tourDone || seenIntro || ui.tourOffered) return;
    if (openedOn === `/stop/${stops.at(-1)?.id}`) return;
    ui.startTour();
  }, [openedOn, stops]);

  // FR-71: text size and reduce motion apply to the whole page (see tokens.css, global.css).
  const { textSize, reduceMotion } = useProgress((s) => s.settings);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.dataset.motion = reduceMotion;
  }, [textSize, reduceMotion]);

  return (
    <>
      <TopBar
        regions={content.regions}
        nextRegion={nextRegion}
        earned={earned}
        total={stops.length}
      />
      <SaveGuard />
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <nav aria-label={t('footer.label')} className={styles.footerNav}>
          <Link to="/settings">{t('footer.settings')}</Link>
          <Link to="/credits">{t('footer.credits')}</Link>
        </nav>
      </footer>
      <BottomNav mapRegion={mapRegion} earned={earned} total={stops.length} />
      {notice && <Toast message={notice} />}
      <Celebrations />
      <TipBubble />
      <Tour />
    </>
  );
}
