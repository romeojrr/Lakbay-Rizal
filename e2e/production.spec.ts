// SRS §12 / FR-62: a normal production build with no verified stops shows
// "Content coming soon" instead of the draft stops. Served on port 4174.
import { expect, test } from '@playwright/test';
import { skipIntroOnFreshProfile } from './helpers';

test.use({ baseURL: 'http://localhost:4174' });

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

test('production build without verified stops shows "Content coming soon"', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Content coming soon' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Passport · 0\/0/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Enter / })).toHaveCount(0);

  // Draft stops cannot be opened by URL either.
  await page.goto('/stop/berlin-1887');
  await expect(page.getByRole('heading', { name: 'That stop is not on the map' })).toBeVisible();
});

test('?preview=1 shows the drafts in the same production build (FR-62)', async ({ page }) => {
  await page.goto('/region/europe?preview=1');
  await expect(page.getByRole('heading', { name: 'Content coming soon' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Passport · 0\/25/ })).toBeVisible();
  // Preview mode stays on while moving around the site.
  await page.getByRole('link', { name: 'Asia' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Asia' })).toBeVisible();
  await page.goto('/stop/berlin-1887');
  await expect(page.getByRole('heading', { name: 'This stop is still locked' })).toBeVisible();
});
