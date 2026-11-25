import { createBrowserRouter } from 'react-router-dom';
import { createRoutes, routerFuture } from './routes';

export const router = createBrowserRouter(createRoutes(), {
  basename: import.meta.env.BASE_URL,
  future: routerFuture,
});
