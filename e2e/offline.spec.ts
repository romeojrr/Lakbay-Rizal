// NFR-7: after one visit, the game loads and plays offline.
// Playwright's offline emulation and request routing both make Chromium bypass the service
// worker, so this test does the real thing: it runs its own server and stops it.
import { expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { finishStory, skipIntroOnFreshProfile } from './helpers';

async function waitForServer(url: string) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${url} did not start`);
}

// This test is about the service worker, so it is allowed here (blocked in the other tests).
test.use({ serviceWorkers: 'allow' });

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

test('after one visit the game loads and plays offline', async ({ page }, testInfo) => {
  // Serves the drafts build that the main web server already made (dist/).
  const port = 4180 + testInfo.parallelIndex;
  const origin = `http://localhost:${port}`;
  let server: ChildProcess | null = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort'],
    { stdio: 'ignore' },
  );
  try {
    await waitForServer(origin);

    await page.goto(`${origin}/region/philippines`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    // Go offline for real: stop the server.
    server.kill();
    server = null;
    await expect
      .poll(() =>
        page.evaluate(() =>
          fetch(`/not-cached-${Date.now()}`)
            .then(() => 'online')
            .catch(() => 'offline'),
        ),
      )
      .toBe('offline');

    // A page never opened before, loaded straight from the cache.
    await page.goto(`${origin}/stop/calamba-1861`);
    await expect(page.getByRole('heading', { level: 1, name: 'Calamba · 1861' })).toBeVisible();
    const scene = page.locator('section img').first();
    await expect
      .poll(() => scene.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);

    // And it still plays: finish the dialogue and open the quiz.
    await finishStory(page);
    await page.getByRole('link', { name: 'Quiz ▶', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Calamba Quiz' })).toBeVisible();

    await page.goto(`${origin}/region/europe`);
    const map = page.getByRole('img', { name: 'Pixel map of Europe' });
    await expect
      .poll(() => map.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  } finally {
    server?.kill();
  }
});
