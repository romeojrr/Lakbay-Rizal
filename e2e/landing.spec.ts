// U9 landing ("/"): the world map, the title card, MAGLAKBAY flies down to the next stop and
// opens its region's map; Continue for returning players; reduced motion; phones.
import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { horizontalOverflow, skipIntroOnFreshProfile } from './helpers';

test('open "/", press MAGLAKBAY, land on the map with Calamba as the next stop', async ({
  page,
}) => {
  await skipIntroOnFreshProfile(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'LAKBAY RIZAL' })).toBeVisible();
  await expect(page.getByText("Follow José Rizal's journey around the world.")).toBeVisible();
  await expect(page.getByText(/^1861 – 1896 · 25 stops · 4 regions$/)).toBeVisible();
  // No saved progress yet: no Continue link. No top bar or bottom bar here.
  await expect(page.getByRole('link', { name: /^Continue/ })).toHaveCount(0);
  await expect(page.getByRole('banner')).toHaveCount(0);
  expect(await horizontalOverflow(page)).toBe(0);
  await expectNoSeriousA11yIssues(page, 'landing');

  // MAGLAKBAY is the first thing the keyboard reaches.
  await page.keyboard.press('Tab');
  const start = page.getByRole('button', { name: /MAGLAKBAY/ });
  await expect(start).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByText('Heading to Calamba, 1861 …')).toBeVisible();
  await expect(page).toHaveURL(/\/region\/philippines$/, { timeout: 8000 });
  await expect(page.getByText('First stop')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enter Calamba ▶' })).toBeVisible();
});

test('Skip (or Esc) lands at once', async ({ page }) => {
  await skipIntroOnFreshProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: /MAGLAKBAY/ }).click();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page).toHaveURL(/\/region\/philippines$/, { timeout: 2000 });
});

test('reduced motion: no fly-down, a short fade to the map', async ({ page }) => {
  await skipIntroOnFreshProfile(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /MAGLAKBAY/ }).click();
  await expect(page).toHaveURL(/\/region\/philippines$/, { timeout: 1500 });
});

test('returning players: Continue goes to the map; MAGLAKBAY flies to their next stop', async ({
  page,
}) => {
  await skipIntroOnFreshProfile(page);
  await page.addInitScript(() => {
    const key = 'lakbay-rizal:v1';
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      state?: Record<string, unknown>;
    };
    if (saved.state && !(saved.state.completed as string[]).length) {
      const done = ['calamba-1861', 'binan-1869', 'ateneo-1872', 'ust-1877'];
      saved.state = { ...saved.state, completed: done, visited: done, stamps: done };
      localStorage.setItem(key, JSON.stringify(saved));
    }
  });
  await page.goto('/');
  const go = page.getByRole('link', { name: 'Continue: Barcelona · 1882' });
  await expect(go).toBeVisible();
  await page.getByRole('button', { name: /MAGLAKBAY/ }).click();
  await expect(page.getByText('Heading to Barcelona, 1882 …')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/region\/europe$/);
});

test('Filipino: the card in Filipino', async ({ page }) => {
  await skipIntroOnFreshProfile(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'FIL (Filipino)' }).click();
  await expect(
    page.getByText('Sundan ang paglalakbay ni José Rizal sa buong mundo.'),
  ).toBeVisible();
  await expect(page.getByText(/^1861 – 1896 · 25 hinto · 4 rehiyon$/)).toBeVisible();
});
