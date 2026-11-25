// U7 / FR-85 (SRS v2.3 §3.9) and FR-88: save code export → reset → import; the leave warning
// only mid-quiz; the "Saved" indicator; the /timeline page.
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { finishStory, openFromMenu, skipIntroOnFreshProfile } from './helpers';
import { playQuiz } from './quiz';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

/** Closes the page as a refresh would, and says whether the browser asked "Leave site?". */
async function leaveAsks(page: Page): Promise<boolean> {
  let asked = false;
  page.on('dialog', (dialog) => {
    if (dialog.type() === 'beforeunload') asked = true;
    void dialog.accept();
  });
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => page.isClosed()).toBe(true);
  return asked;
}

test('export → reset → import restores the progress exactly', async ({ page }) => {
  await page.goto('/stop/calamba-1861');
  await finishStory(page);
  await page.getByRole('link', { name: 'Take the quiz ▶' }).click();
  await playQuiz(page, 'calamba-1861');
  await expect(page.getByRole('link', { name: /Passport · 1\/25/ })).toBeVisible();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('lakbay-rizal:v1') ?? '{}').state,
  );

  await openFromMenu(page, 'Settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download save code' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.lakbay$/);
  const code = await page.getByLabel('Your save code').inputValue();
  expect(code).toMatch(/^LR2\./);
  await expectNoSeriousA11yIssues(page, 'settings with a save code');

  await page.getByRole('button', { name: 'Reset progress' }).click();
  await page
    .getByRole('dialog', { name: 'Reset all progress?' })
    .getByRole('button', { name: 'Yes, reset' })
    .click();
  await expect(page.getByRole('link', { name: /Passport · 0\/25/ })).toBeVisible();

  await page.getByLabel('Paste a save code').fill(code);
  await page.getByRole('button', { name: 'Load this code' }).click();
  await page
    .getByRole('dialog', { name: 'Load save code' })
    .getByRole('button', { name: 'Load this code' })
    .click();
  await expect(page.getByText('Progress loaded')).toBeVisible();
  await expect(page.getByRole('link', { name: /Passport · 1\/25/ })).toBeVisible();
  const after = await page.evaluate(
    () => JSON.parse(localStorage.getItem('lakbay-rizal:v1') ?? '{}').state,
  );
  // Everything comes back; only the time of this download is new.
  expect({ ...after, save: undefined }).toEqual({ ...before, save: undefined });
});

test('refresh on the map: no warning', async ({ page }) => {
  await page.goto('/region/philippines');
  await page.getByRole('button', { name: 'Free explore' }).click(); // a real click, as a player
  expect(await leaveAsks(page)).toBe(false);
});

test('refresh mid-quiz: the browser asks before leaving', async ({ page }) => {
  await page.goto('/stop/calamba-1861');
  await finishStory(page);
  await page.getByRole('link', { name: 'Take the quiz ▶' }).click();
  await page.getByRole('button', { name: 'Check' }).click(); // question 1 checked unsolved
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  expect(await leaveAsks(page)).toBe(true);
});

test('the save indicator shows "Saved" after a change', async ({ page }) => {
  await page.goto('/region/philippines');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await expect(page.locator('[data-guide="save-indicator"]').getByText('Saved')).toBeAttached();
});

test('/timeline: every stop, filters, keyboard and screen-reader friendly (FR-88)', async ({
  page,
}) => {
  await page.goto('/timeline');
  await expect(page.getByRole('heading', { level: 1, name: 'Timeline' })).toBeVisible();
  const items = page.getByRole('main').getByRole('listitem');
  await expect(items).toHaveCount(25);
  await page
    .getByRole('group', { name: 'Region' })
    .getByRole('button', { name: 'America' })
    .click();
  await expect(items).toHaveCount(1);
  await expectNoSeriousA11yIssues(page, 'timeline');
});
