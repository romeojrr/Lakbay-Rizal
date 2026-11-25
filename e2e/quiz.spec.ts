import { expect, test } from '@playwright/test';
import { finishStory, skipIntroOnFreshProfile } from './helpers';
import { playQuiz } from './quiz';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

/** Picks the right or a wrong answer for whichever Berlin question is showing. */
test('completing Berlin adds stamp + item, and it survives a refresh (M4, SRS §12 steps 3–7)', async ({
  page,
}) => {
  // 3. Free explore → Berlin
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.getByRole('link', { name: 'Berlin, 1887, open' }).click();

  // 4. Finish the story → Quiz enables
  await finishStory(page);
  await page.getByRole('link', { name: 'Quiz ▶', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Berlin Quiz' })).toBeVisible();

  // 5. Wrong → hint, no penalty → right → next → right
  await playQuiz(page, 'berlin-1887', { wrongFirst: true });

  // 6. Reward card → Open passport shows Berlin with New!
  await expect(page.getByText('Berlin stamp and Noli Me Tangere are yours.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Passport · 1\/25/ })).toBeVisible();
  await page.getByRole('link', { name: 'Open passport ▶' }).click();
  const berlinStamp = page.getByRole('listitem').filter({ hasText: 'Berlin' });
  await expect(berlinStamp).toBeVisible();
  await expect(berlinStamp.getByText('New!')).toBeVisible();

  // 7. Refresh → stamp still there; New! gone after the passport was opened
  await page.reload();
  await expect(page.getByRole('listitem').filter({ hasText: 'Berlin' })).toBeVisible();
  await expect(page.getByText('New!')).toHaveCount(0);
  await expect(page.getByText('1 of 25')).toBeVisible();

  await page.getByRole('link', { name: 'Open journal ▶' }).click();
  await expect(page.getByText('Noli Me Tangere')).toBeVisible();

  // Progress (and Free mode) also survives on the map.
  await page.goto('/region/europe');
  await expect(page.getByRole('link', { name: 'Berlin, 1887, completed' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Free explore' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('a damaged save is kept aside and the game starts fresh with a notice', async ({ page }) => {
  await page.goto('/region/europe');
  await page.evaluate(() => localStorage.setItem('lakbay-rizal:v1', '{not json'));
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'could not be read' })).toBeVisible();
  // A fresh start shows the intro again (FR-4).
  await page.getByRole('button', { name: 'Skip' }).click();
  expect(await page.evaluate(() => localStorage.getItem('lakbay-rizal:v1:corrupt'))).toBe(
    '{not json',
  );
  await expect(page.getByRole('link', { name: /Passport · 0\/25/ })).toBeVisible();
});
