import type { RouteObject } from 'react-router-dom';
import { loadContent, loadStories } from '../content/loader';
import { isPreviewMode } from '../content/preview';
import { loadTranslations } from '../content/translations';
import type { Content, Stop } from '../content/schemas';
import type { StopV3 } from '../content/schemas.v3';
import { getVisibleStops, shouldIncludeDrafts } from '../content/selectors';
import HomeRedirect from '../features/map/HomeRedirect';
import MapPage from '../features/map/MapPage';
import { useProgress } from '../store/progress';
import ContentError from './ContentError';
import Layout from './Layout';
import LoadingScreen from './LoadingScreen';
import NotFoundPage from './NotFoundPage';

export interface RootData {
  content: Content;
  /** Stops the player may see in this build (FR-62), in order. */
  stops: Stop[];
  /** Content v3 (§6.2b): the story player's chapters, by stop. */
  stories: StopV3[];
}

export type RootLoader = () => Promise<RootData>;

export async function rootLoader(): Promise<RootData> {
  // §3.10: a player who chose Filipino gets the Filipino text from the first paint.
  const filipino = useProgress.getState().settings.lang === 'fil' ? loadTranslations() : null;
  const [content, stories] = await Promise.all([loadContent(), loadStories(), filipino]);
  const includeDrafts = shouldIncludeDrafts({
    dev: import.meta.env.DEV,
    buildFlag: __INCLUDE_DRAFTS__,
    previewParam: isPreviewMode(window.location.search),
  });
  return { content, stops: getVisibleStops(content.stops, includeDrafts), stories };
}

/**
 * Pages other than the map load on first use (NFR-1: less JavaScript before the first
 * paint). The service worker precaches them, so they still open offline.
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

// The routes of SRS FR-2.
export function createRoutes(loader: RootLoader = rootLoader): RouteObject[] {
  return [
    {
      id: 'root',
      path: '/',
      loader,
      shouldRevalidate: () => false, // content never changes while the game runs
      element: <Layout />,
      errorElement: <ContentError />,
      HydrateFallback: LoadingScreen,
      children: [
        { index: true, Component: HomeRedirect },
        { path: 'region/:regionId', Component: MapPage },
        { path: 'stop/:stopId', lazy: page(() => import('../features/stop/StopPage')) },
        { path: 'stop/:stopId/quiz', lazy: page(() => import('../features/quiz/QuizPage')) },
        { path: 'passport', lazy: page(() => import('../features/passport/PassportPage')) },
        { path: 'journal', lazy: page(() => import('../features/journal/JournalPage')) },
        { path: 'dapitan/build', lazy: page(() => import('../features/builder/BuilderPage')) },
        { path: 'scenes', lazy: page(() => import('../features/gallery/GalleryPage')) },
        { path: 'settings', lazy: page(() => import('../features/settings/SettingsPage')) },
        { path: 'credits', lazy: page(() => import('../features/credits/CreditsPage')) },
        { path: '*', Component: NotFoundPage },
      ],
    },
  ];
}

export const routerFuture = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
} as const;
