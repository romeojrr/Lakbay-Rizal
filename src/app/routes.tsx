import type { RouteObject } from 'react-router-dom';
import Layout from './Layout';

// M0: an empty shell. Each milestone adds its SRS FR-2 routes here.
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [{ index: true }, { path: '*' }],
  },
];

export const routerFuture = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
} as const;
