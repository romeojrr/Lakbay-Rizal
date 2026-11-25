import { expect, test } from '@playwright/test';
import { horizontalOverflow, openFromMenu, skipIntroOnFreshProfile } from './helpers';

test("fresh profile: Rizal's tour runs once; Skip ends it; Settings replays it (FR-4, FR-84)", async ({
  page,
}) => {
  await page.goto('/');
  const tour = page.getByRole('dialog', { name: 'Tour with José Rizal' });
  await expect(tour).toBeVisible();
  await expect(tour.getByText('Step 1 of 14')).toBeVisible();
  await tour.getByRole('button', { name: 'Next' }).click();
  // Step 2 shines a light on the map.
  await expect(tour.getByText('Step 2 of 14')).toBeVisible();
  await expect(page.locator('[data-guide="map"]')).toBeInViewport();
  await tour.getByRole('button', { name: 'Skip tour' }).click();
  await expect(tour).toBeHidden();
  // §12 step 2: the map opens on the first region with stop 1 current.
  await expect(page.getByRole('link', { name: 'Enter Calamba ▶' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Philippines' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Tour with José Rizal' })).toHaveCount(0);

  await openFromMenu(page, 'Settings');
  await page.getByRole('button', { name: 'Replay the tour' }).click();
  await expect(page.getByRole('dialog', { name: 'Tour with José Rizal' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Tour with José Rizal' })).toHaveCount(0);
});

test.describe('with the intro already seen', () => {
  test.beforeEach(async ({ page }) => {
    await skipIntroOnFreshProfile(page);
  });

  test('Settings → Reset progress → confirm → the map is back at the start (SRS §12 step 10)', async ({
    page,
  }) => {
    await page.goto('/region/europe');
    await page.getByRole('button', { name: 'Free explore' }).click();
    await openFromMenu(page, 'Settings');

    await page.getByRole('button', { name: 'Reset progress' }).click();
    const confirm = page.getByRole('dialog', { name: 'Reset all progress?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Yes, reset' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Progress was reset' })).toBeVisible();

    await page.goto('/');
    await page
      .getByRole('dialog', { name: 'Tour with José Rizal' })
      .getByRole('button', { name: 'Skip tour' })
      .click();
    await expect(page).toHaveURL(/\/region\/philippines$/);
    await expect(page.getByRole('button', { name: 'Guided' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('link', { name: 'Enter Calamba ▶' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Passport · 0\/25/ })).toBeVisible();
  });

  test('Large text keeps the page within the screen', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('radio', { name: 'Large' }).check();
    await page.goto('/region/europe');
    await expect(page.getByRole('heading', { level: 1, name: 'Europe' })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await page.goto('/region/philippines');
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('scene gallery: Free explore shows all 25 scenes', async ({ page }) => {
    await page.goto('/region/europe');
    await page.getByRole('button', { name: 'Free explore' }).click();
    await openFromMenu(page, 'Scenes');
    const list = page.getByRole('navigation', { name: 'Choose a scene' });
    await expect(list.getByRole('button')).toHaveCount(25);
    await list.getByRole('button', { name: /25 · Bagumbayan/ }).click();
    await expect(page).toHaveURL(/\/scenes\?stop=bagumbayan-1896$/);
    await expect(page.getByRole('heading', { name: 'His final day' })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('credits list every source, and unknown URLs show a 404 page', async ({ page }) => {
    await page.goto('/credits');
    await expect(page.getByRole('heading', { level: 1, name: 'Credits' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Sources' }).getByRole('listitem')).toHaveCount(
      60,
    );

    await page.goto('/no/such/page');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to the map' }).click();
    await expect(page).toHaveURL(/\/region\//);
  });
});
