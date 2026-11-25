import { expect, test } from '@playwright/test';
import { playStory, skipIntroOnFreshProfile } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

test('Dapitan: finish dialogue → builder → clinic + water system → stamp (M5, SRS §12 step 9)', async ({
  page,
}) => {
  await page.goto('/region/philippines');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.getByRole('link', { name: 'Dapitan, 1892, open' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Dapitan · 1892' })).toBeVisible();

  await playStory(page);
  await page.getByRole('link', { name: 'Build the town ▶' }).click();

  await expect(page.getByText('Town projects 1/3')).toBeVisible();
  await page.getByRole('button', { name: 'Build the Clinic' }).click();
  await expect(page.getByRole('img', { name: 'Clinic' })).toBeVisible();
  await page.getByRole('button', { name: 'Build the Water system' }).click();
  await expect(page.getByText('Town projects 3/3')).toBeVisible();
  await expect(page.getByText('Dapitan stamp earned!')).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole('link', { name: 'Open passport ▶' }).click();
  const stamp = page.getByRole('listitem').filter({ hasText: 'Dapitan' });
  await expect(stamp).toBeVisible();
  await expect(stamp.getByText('New!')).toBeVisible();

  // The builder survives a refresh too.
  await page.goto('/dapitan/build');
  await expect(page.getByText('Town projects 3/3')).toBeVisible();
});
