import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav/BottomNav';
import Celebrations from '../components/Celebrations/Celebrations';
import RouteIris from '../components/RouteIris/RouteIris';
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
import { unlockOnFirstGesture, useMusic } from '../lib/sound';

const NOTICE_MS = 6000;

/**
 * App shell (SRS v2.3 §5.5): slim top bar, page, bottom navigation (phones). The shell is one
 * screen tall and the body never scrolls; a page longer than the screen scrolls inside the
 * page area (owner, 2026-11-26). Settings is the gear in the top bar; Credits is in Settings.
 */
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
  // U9: on a first visit the landing page comes first; the tour starts when the player
  // reaches a region map (after "Begin the journey"), or at once if the game opened on another page.
  const [openedOn] = useState(pathname);
  useEffect(() => {
    const { tourDone, seenIntro } = useProgress.getState();
    const ui = useUi.getState();
    if (tourDone || seenIntro || ui.tourOffered) return;
    if (openedOn === `/stop/${stops.at(-1)?.id}`) return;
    if (pathname === '/') return;
    if (openedOn === '/' && !pathname.startsWith('/region/')) return;
    ui.startTour();
  }, [openedOn, pathname, stops]);

  // A new page starts at its top (the page area, not the window, scrolls).
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo?.({ top: 0 });
  }, [pathname]);

  // §3.11: sound is allowed from the first click; music follows the region on screen.
  useEffect(() => unlockOnFirstGesture(), []);
  const regionOnScreen =
    /^\/region\/([a-z]+)/.exec(pathname)?.[1] ??
    stops.find((s) => pathname.startsWith(`/stop/${s.id}`))?.region;
  // The landing page and Settings have their own tunes; the map and stops play the region's.
  useMusic(pathname === '/' ? 'world' : pathname === '/settings' ? 'settings' : regionOnScreen);

  // FR-71: text size and reduce motion apply to the whole page (see tokens.css, global.css).
  const { textSize, reduceMotion } = useProgress((s) => s.settings);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.dataset.motion = reduceMotion;
  }, [textSize, reduceMotion]);

  // U9 landing: the world map fills the screen with its own small bar.
  if (pathname === '/') {
    return (
      <>
        <main>
          <Outlet />
        </main>
        <Celebrations />
        <TipBubble />
        <RouteIris />
      </>
    );
  }

  return (
    <div className={styles.shell}>
      <TopBar
        regions={content.regions}
        nextRegion={nextRegion}
        earned={earned}
        total={stops.length}
      />
      <SaveGuard />
      <main ref={mainRef} className={styles.main}>
        <Outlet />
      </main>
      <BottomNav mapRegion={mapRegion} earned={earned} total={stops.length} />
      {notice && <Toast message={notice} />}
      <Celebrations />
      <TipBubble />
      <Tour />
      <RouteIris />
    </div>
  );
}
