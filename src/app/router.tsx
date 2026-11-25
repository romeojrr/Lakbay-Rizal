import { createBrowserRouter } from 'react-router-dom';
import { routerFuture, routes } from './routes';

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL,
  future: routerFuture,
});
