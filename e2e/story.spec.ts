import { expect, test } from '@playwright/test';

test('Berlin plays end to end from the Europe map and back (M3)', async ({ page }) => {
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.getByRole('link', { name: 'Berlin, 1887, open' }).click();

  await expect(page).toHaveURL(/\/stop\/berlin-1887$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Berlin · 1887' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dramatized' })).toBeVisible();
  await expect(page.getByText('Quiz ▶')).toHaveAttribute('aria-disabled', 'true');

  const next = page.getByRole('button', { name: 'Next ▶' });
  await next.click();
  await next.click();
  await expect(page.getByRole('button', { name: 'Replay ↺' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quiz ▶' })).toHaveAttribute(
    'href',
    '/stop/berlin-1887/quiz',
  );

  // Read more: a modal dialog; Esc closes it and focus returns to the button.
  const readMore = page.getByRole('button', { name: 'Read more' });
  await readMore.click();
  const dialog = page.getByRole('dialog', { name: 'The Noli is printed' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused(); // focus stays inside
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(readMore).toBeFocused();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // FR-3: back returns to the map the player came from.
  await page.getByRole('link', { name: '◀ Back to map' }).click();
  await expect(page).toHaveURL(/\/region\/europe$/);
});

test('the dialogue box sits below the scene on small screens', async ({ page }, testInfo) => {
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.getByRole('link', { name: 'Berlin, 1887, open' }).click();
  const scene = await page.getByRole('img', { name: /Berlin print works/ }).boundingBox();
  const box = await page.getByRole('region', { name: 'Dialogue' }).boundingBox();
  expect(scene && box).toBeTruthy();
  const overlap = (scene?.y ?? 0) + (scene?.height ?? 0) - (box?.y ?? 0);
  if (testInfo.project.name === 'mobile') expect(overlap).toBeLessThanOrEqual(0);
  else expect(overlap).toBeGreaterThan(0);
});
