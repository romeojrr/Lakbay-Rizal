// U6 / FR-84 (SRS v2.3 §3.7): the whole tour, from the map to Calamba, with a spotlight on each
// target, the click step, Esc, and focus kept in the card.
import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';

test('all 14 steps: spotlights, the pin click, the move to Calamba, then done', async ({
  page,
}) => {
  await page.goto('/');
  const tour = page.getByRole('dialog', { name: 'Tour with José Rizal' });
  await expect(tour.getByText('Step 1 of 14')).toBeVisible();
  await expect(tour).toBeFocused();
  await expectNoSeriousA11yIssues(page, 'tour, centred card');

  // Tab stays inside the card.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(tour.getByRole('button', { name: 'Skip tour' })).toBeFocused();

  for (let n = 1; n <= 5; n++) {
    await expect(tour.getByText(`Step ${n} of 14`)).toBeVisible();
    await tour.getByRole('button', { name: 'Next' }).click();
  }
  // Step 6 waits for the glowing pin: "Do it for me" clicks it.
  await expect(tour.getByText('Step 6 of 14')).toBeVisible();
  await tour.getByRole('button', { name: 'Do it for me' }).click();
  await expect(page).toHaveURL(/\/stop\/calamba-1861$/);
  await expect(tour.getByText('Step 7 of 14')).toBeVisible();
  await tour.getByRole('button', { name: 'Next' }).click();

  // Step 8 points at a line tag: the story moves to Teodora's first line.
  await expect(tour.getByText('Step 8 of 14')).toBeVisible();
  await expect(page.locator('[data-guide="line-tag"]').first()).toBeVisible();
  await expectNoSeriousA11yIssues(page, 'tour, spotlight');

  for (let n = 8; n <= 13; n++) {
    await expect(tour.getByText(`Step ${n} of 14`)).toBeVisible();
    await tour.getByRole('button', { name: 'Next' }).click();
  }
  await expect(tour.getByText('Step 14 of 14')).toBeVisible();
  await tour.getByRole('button', { name: 'Let us begin' }).click();
  await expect(tour).toHaveCount(0);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lakbay-rizal:v1') ?? '{}'),
  );
  expect(saved.state.tourDone).toBe(true);
});

test('never on the final stop (GD-6)', async ({ page }) => {
  await page.goto('/stop/bagumbayan-1896');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Tour with José Rizal' })).toHaveCount(0);
});
