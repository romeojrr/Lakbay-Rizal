import { expect, test, type Page } from '@playwright/test';

/** Picks the right or a wrong answer for whichever Berlin question is showing. */
async function answerBerlin(page: Page, correctly: boolean) {
  const group = page.getByRole('group', { name: /\?$/ });
  const prompt = (await group.getAttribute('aria-labelledby')) ?? '';
  const lent = (await page.locator(`#${prompt}`).textContent())?.startsWith('Who lent');
  const name = lent
    ? correctly
      ? 'Maximo Viola'
      : 'Ferdinand Blumentritt'
    : correctly
      ? /^2,000/
      : /^20,000/;
  await group.getByRole('button', { name }).click();
}

test('completing Berlin adds stamp + item, and it survives a refresh (M4, SRS §12 steps 3–7)', async ({
  page,
}) => {
  // 3. Free explore → Berlin
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.getByRole('link', { name: 'Berlin, 1887, open' }).click();

  // 4. Step through the dialogue → Quiz enables
  await page.getByRole('button', { name: 'Next ▶' }).click();
  await page.getByRole('button', { name: 'Next ▶' }).click();
  await page.getByRole('link', { name: 'Quiz ▶' }).click();
  await expect(page.getByRole('heading', { name: 'Berlin Quiz' })).toBeVisible();

  // 5. Wrong → hint, no penalty → right → next → right
  await answerBerlin(page, false);
  await expect(page.getByText(/^Hint: /)).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await answerBerlin(page, true);
  await page.getByRole('button', { name: 'Next question ▶' }).click();
  await answerBerlin(page, true);
  await page.getByRole('button', { name: 'See your reward ▶' }).click();

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
  expect(await page.evaluate(() => localStorage.getItem('lakbay-rizal:v1:corrupt'))).toBe(
    '{not json',
  );
  await expect(page.getByRole('link', { name: /Passport · 0\/25/ })).toBeVisible();
});
