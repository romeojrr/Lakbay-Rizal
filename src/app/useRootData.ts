import { useRouteLoaderData } from 'react-router-dom';
import type { RootData } from './routes';

/** The loaded content and visible stops, available on every page. */
export function useRootData(): RootData {
  const data = useRouteLoaderData('root') as RootData | undefined;
  if (!data) throw new Error('useRootData must be used inside the root route');
  return data;
}
