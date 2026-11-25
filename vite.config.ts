import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// BASE_PATH lets the site live in a sub-folder, e.g. GitHub Pages: BASE_PATH=/lakbay-rizal/
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  build: {
    // Hashed JS/CSS/fonts go to /bundle/, so /assets/ holds only our art. The service worker
    // treats files in the bundle folder as content-hashed; art in /assets/ gets a revision
    // and updates in players' caches when a scene is changed.
    assetsDir: 'bundle',
  },
  plugins: [
    react(),
    // NFR-7: after one visit the game loads and plays offline. Every page, art file,
    // font and content file is precached; navigation falls back to index.html.
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/main.tsx once the browser is idle, so installing the cache
      // does not compete with the first paint (NFR-1).
      injectRegister: null,
      // The icons are already precached by globPatterns; listing them twice with different
      // revisions makes Workbox throw, leaving the worker active with an empty cache.
      includeManifestIcons: false,
      manifest: {
        name: 'Lakbay Rizal',
        short_name: 'Lakbay Rizal',
        description: "A pixel-art journey through José Rizal's life, stop by stop.",
        lang: 'en',
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: '#1F1A24',
        background_color: '#F4EEDF',
        icons: [
          { src: 'assets/icons/app/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/icons/app/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'assets/icons/app/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2,json,svg}'],
        // The game text is Latin script; skip font subsets it never uses.
        globIgnores: ['**/*cyrillic*', '**/*vietnamese*'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  define: {
    // FR-62: `INCLUDE_DRAFTS=true npm run build` shows draft stops in a production build.
    // Vercel preview deployments include drafts too (like Netlify's deploy previews).
    __INCLUDE_DRAFTS__: JSON.stringify(
      process.env.INCLUDE_DRAFTS === 'true' || process.env.VERCEL_ENV === 'preview',
    ),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
});
