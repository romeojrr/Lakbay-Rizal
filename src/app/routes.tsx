import type { RouteObject } from 'react-router-dom';
import { loadContent } from '../content/loader';
import { isPreviewMode } from '../content/preview';
import type { Content, Stop } from '../content/schemas';
import { getVisibleStops, shouldIncludeDrafts } from '../content/selectors';
import BuilderPage from '../features/builder/BuilderPage';
import CreditsPage from '../features/credits/CreditsPage';
import GalleryPage from '../features/gallery/GalleryPage';
import JournalPage from '../features/journal/JournalPage';
import HomeRedirect from '../features/map/HomeRedirect';
import MapPage from '../features/map/MapPage';
import PassportPage from '../features/passport/PassportPage';
import QuizPage from '../features/quiz/QuizPage';
import SettingsPage from '../features/settings/SettingsPage';
import StopPage from '../features/stop/StopPage';
import ContentError from './ContentError';
import Layout from './Layout';
import LoadingScreen from './LoadingScreen';
import NotFoundPage from './NotFoundPage';

export interface RootData {
  content: Content;
  /** Stops the player may see in this build (FR-62), in order. */
  stops: Stop[];
}

export type RootLoader = () => Promise<RootData>;

export async function rootLoader(): Promise<RootData> {
  const content = await loadContent();
  const includeDrafts = shouldIncludeDrafts({
    dev: import.meta.env.DEV,
    buildFlag: __INCLUDE_DRAFTS__,
    previewParam: isPreviewMode(window.location.search),
  });
  return { content, stops: getVisibleStops(content.stops, includeDrafts) };
}

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
        { path: 'stop/:stopId', Component: StopPage },
        { path: 'stop/:stopId/quiz', Component: QuizPage },
        { path: 'passport', Component: PassportPage },
        { path: 'journal', Component: JournalPage },
        { path: 'dapitan/build', Component: BuilderPage },
        { path: 'scenes', Component: GalleryPage },
        { path: 'settings', Component: SettingsPage },
        { path: 'credits', Component: CreditsPage },
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
