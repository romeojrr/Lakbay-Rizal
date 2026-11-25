// U5 / FR-83 (SRS v2.3 §3.7, §3.8): XP, reactions, achievement toasts, gold stamps and the
// Passport tabs, in English and Filipino.
import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { finishStory, skipIntroOnFreshProfile } from './helpers';
import { playQuiz } from './quiz';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

test('a perfect Calamba: XP, Rizal reacts, toasts, gold stamp, Passport tabs', async ({ page }) => {
  await page.goto('/stop/calamba-1861');
  await finishStory(page);
  await page.getByRole('link', { name: 'Take the quiz ▶' }).click();

  // The first answer: +XP next to Correct!, and Rizal says something.
  await playQuiz(page, 'calamba-1861');
  await expect(page.getByText('Gold stamp')).toBeVisible();
  await expect(page.getByText(/^Achievement unlocked$/)).toBeVisible();
  const xp = page.getByRole('banner').getByText(/^\d+ XP$/);
  await expect(xp).not.toHaveText('0 XP');
  await expectNoSeriousA11yIssues(page, 'reward with toast');

  await page.getByRole('link', { name: 'Open passport ▶' }).click();
  await expect(page.getByText('Gold', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Achievements' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Achievements' });
  await expect(panel.getByText('First steps')).toBeVisible();
  await expect(panel.getByText('Sobresaliente')).toBeVisible();
  await expectNoSeriousA11yIssues(page, 'passport achievements');

  // Filipino: the badges are in Filipino too.
  await page.getByRole('banner').getByRole('button', { name: 'FIL (Filipino)' }).click();
  await page.getByRole('tab', { name: /Achievements|Mga nakamit/ }).click();
  await expect(page.getByRole('tabpanel').getByText('Unang hakbang')).toBeVisible();
  await page.getByRole('tab', { name: /Rank|Ranggo/ }).click();
  await expect(page.getByRole('tabpanel').getByText('Estudyante').first()).toBeVisible();
});

test('a wrong answer: Rizal encourages, the streak resets', async ({ page }) => {
  await page.goto('/stop/calamba-1861');
  await finishStory(page);
  await page.getByRole('link', { name: 'Take the quiz ▶' }).click();
  await playQuiz(page, 'calamba-1861', { wrongFirst: true });
  // One wrong answer: still 4 of 5 on the first try, so gold.
  await expect(page.getByText('Gold stamp')).toBeVisible();
});
