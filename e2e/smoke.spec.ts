import { expect, test } from '@playwright/test';
import { skipIntroOnFreshProfile } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

test('shell shows the header with no horizontal page scroll', async ({ page }) => {
  await page.goto('/');

  const header = page.getByRole('banner');
  await expect(header).toBeVisible();
  await expect(header.getByRole('link', { name: 'LAKBAY RIZAL' })).toBeVisible();
  await expect(header.getByRole('navigation', { name: 'Regions' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Scenes' })).toBeVisible();
  await expect(header.getByRole('link', { name: /^Passport/ })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('self-hosted fonts load and every request stays on the same origin', async ({
  page,
  baseURL,
}) => {
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http')) origins.add(url.origin);
  });

  await page.goto('/');
  // Wait for the header (the first Pixelify text), then make sure both fonts load.
  await expect(page.getByRole('banner')).toBeVisible();
  const fontsReady = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('700 26px "Pixelify Sans"'),
      document.fonts.load('600 16px "Nunito"'),
    ]);
    return {
      pixel: document.fonts.check('700 26px "Pixelify Sans"'),
      body: document.fonts.check('600 16px "Nunito"'),
    };
  });

  expect(fontsReady).toEqual({ pixel: true, body: true });
  expect([...origins]).toEqual([new URL(baseURL ?? '').origin]);
});

test('a region URL loads directly and survives a refresh', async ({ page }) => {
  await page.goto('/region/europe');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Europe' })).toHaveAttribute('aria-current', 'page');
});
