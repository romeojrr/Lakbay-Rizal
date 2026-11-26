import { expect, test, type Page } from '@playwright/test';
import { skipIntroOnFreshProfile } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

test('fresh profile opens the Philippines with Calamba current and later stops locked', async ({
  page,
}) => {
  await page.goto('/map');
  await expect(page).toHaveURL(/\/region\/philippines$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Philippines' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '8 Manila area stops, show the close-up map' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Locked stop, 1892' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter Calamba ▶' })).toBeVisible();
  await noHorizontalScroll(page);
});

test('locked pins explain themselves; Free explore opens them', async ({ page }) => {
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Locked stop, 1888' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Finish the previous stop first.' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Free explore' }).click();
  const berlin = page.getByRole('link', { name: 'Berlin, 1887, open' });
  await expect(berlin).toHaveAttribute('href', '/stop/berlin-1887');
  await noHorizontalScroll(page);
});

test('pins stay on their towns when zoomed (FR-16)', async ({ page }) => {
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Free explore' }).click();
  // Four zoom levels: 1× (the whole map), then three steps in.
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  // No hover lift and no drop-in still running (§5.6 motion) while measuring.
  await page.mouse.move(0, 0);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );

  const offset = await page.evaluate(() => {
    const map = document.querySelector<HTMLImageElement>('img[alt="Pixel map of Europe"]');
    const pin = document.querySelector<HTMLElement>('a[href="/stop/berlin-1887"][aria-label]');
    if (!map || !pin) return null;
    const m = map.getBoundingClientRect();
    const p = pin.getBoundingClientRect();
    const svg = pin.querySelector('svg')?.getBoundingClientRect();
    // Berlin in content: 52.52 N, 13.405 E → (64.01 %, 20.84 %) on europe.png.
    return {
      width: m.width,
      dx: p.left + 40 - (m.left + 0.6401 * m.width),
      dy: (svg?.bottom ?? 0) - (m.top + 0.2084 * m.height),
    };
  });
  expect(offset).not.toBeNull();
  expect(Math.abs(offset?.dx ?? 99)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(offset?.dy ?? 99)).toBeLessThanOrEqual(1.5);
});
