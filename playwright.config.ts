import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
/** A normal production build (no drafts), for the "Content coming soon" check (SRS §12). */
const PRODUCTION_PORT = 4174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true },
    },
  ],
  webServer: [
    // The seed stops are drafts, so the main tests use a build that includes them (§12, FR-62).
    {
      command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      env: { ...(process.env as Record<string, string>), INCLUDE_DRAFTS: 'true' },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    // Waits for the first server so the two builds never touch public/assets at once.
    {
      command:
        `npx tsx scripts/wait-for-url.ts http://localhost:${PORT} && ` +
        `npx vite build --outDir dist-prod --emptyOutDir && ` +
        `npx vite preview --outDir dist-prod --port ${PRODUCTION_PORT} --strictPort`,
      url: `http://localhost:${PRODUCTION_PORT}`,
      env: { ...(process.env as Record<string, string>), INCLUDE_DRAFTS: 'false' },
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
