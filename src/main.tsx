import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element in index.html');

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </StrictMode>,
);

// NFR-7 offline support. The service worker is registered once the page has loaded and
// the browser is idle, so caching the whole game does not slow the first paint (NFR-1).
// With autoUpdate, a new version reloads open pages so they never ask for removed files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => {
    void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
  };
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(register, { timeout: 4000 });
    else setTimeout(register, 2000);
  });
}
