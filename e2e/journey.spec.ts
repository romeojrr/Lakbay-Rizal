// SRS §12 end-to-end acceptance test, steps 1–12, on a build with drafts (INCLUDE_DRAFTS=true).
// The desktop project runs it at 1440 px; the mobile project repeats it at 360 × 740 (step 11).
// The production-build check ("Content coming soon") is in production.spec.ts.
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { finishStory, horizontalOverflow, openFromMenu, playStory } from './helpers';
import { playQuiz } from './quiz';

async function noSideScroll(page: Page) {
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
}

test('SRS §12: the whole journey', async ({ page }) => {
  test.setTimeout(180_000);

  await test.step("1. fresh profile → landing → Begin the journey → Rizal's tour starts → skip", async () => {
    await page.goto('/');
    // U9: the landing page first; "Begin the journey" flies down to Calamba, then the tour starts.
    await page.getByRole('button', { name: /Begin the journey/ }).click();
    await expect(page).toHaveURL(/\/region\/philippines$/);
    const tour = page.getByRole('dialog', { name: 'Tour with José Rizal' });
    await expect(tour).toBeVisible();
    await expect(tour.getByText('Step 1 of 14')).toBeVisible();
    await tour.getByRole('button', { name: 'Skip tour' }).click();
    await expect(tour).toBeHidden();
  });

  await test.step('2. map opens on the first region; stop 1 current; later stops locked', async () => {
    await expect(page).toHaveURL(/\/region\/philippines$/);
    await expect(page.getByRole('link', { name: 'Enter Calamba ▶' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Locked stop, 1892' })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'map (step 12)');
    await noSideScroll(page);
  });

  await test.step('3. switch to Free explore → open Berlin', async () => {
    await page.getByRole('link', { name: /^Europe/ }).click();
    await page.getByRole('button', { name: 'Free explore' }).click();
    await page.getByRole('link', { name: 'Berlin, 1887, open' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Berlin · 1887' })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'stop (step 12)');
  });

  await test.step('4. play the whole story → Quiz enables', async () => {
    await playStory(page);
    await page.getByRole('link', { name: 'Quiz ▶', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Berlin Quiz' })).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'quiz (step 12)');
  });

  await test.step('5. wrong → hint, no penalty → right → next → right', async () => {
    await playQuiz(page, 'berlin-1887', { wrongFirst: true });
  });

  await test.step('6. reward card → Open passport shows Berlin with New!', async () => {
    await expect(page.getByText('Berlin stamp and Noli Me Tangere are yours.')).toBeVisible();
    await page.getByRole('link', { name: 'Open passport ▶' }).click();
    const stamp = page.getByRole('listitem').filter({ hasText: 'Berlin' });
    await expect(stamp.getByText('New!')).toBeVisible();
    await expectNoSeriousA11yIssues(page, 'passport (step 12)');
    await noSideScroll(page);
  });

  await test.step('7. refresh → stamp still there; New! gone', async () => {
    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: 'Berlin' })).toBeVisible();
    await expect(page.getByText('New!')).toHaveCount(0);
  });

  await test.step('8. the timeline page lists Dapitan, 1892', async () => {
    await page.goto('/region/europe');
    await page.getByRole('link', { name: /See the whole timeline/ }).click();
    await expect(page).toHaveURL(/\/timeline$/);
    await page
      .getByRole('group', { name: 'Region' })
      .getByRole('button', { name: 'Philippines' })
      .click();
    await expect(
      page.getByText('Dapitan and Talisay, Mindanao', { exact: false }).first(),
    ).toBeVisible();
    await page.goto('/region/philippines');
  });

  await test.step('9. Dapitan → dialogue → builder → clinic + water system → stamp', async () => {
    await page.getByRole('link', { name: 'Dapitan, 1892, open' }).click();
    // The stop page loads on demand: wait for it before stepping through the dialogue.
    await expect(page.getByRole('heading', { level: 1, name: 'Dapitan · 1892' })).toBeVisible();
    await finishStory(page);
    await page.getByRole('link', { name: 'Build the town ▶' }).click();
    await expectNoSeriousA11yIssues(page, 'builder (step 12)');
    await page.getByRole('button', { name: 'Build the Clinic' }).click();
    await page.getByRole('button', { name: 'Build the Water system' }).click();
    await expect(page.getByText('Dapitan stamp earned!')).toBeVisible();
    await expect(page.getByRole('link', { name: /Passport · 2\/25/ })).toBeVisible();
    await noSideScroll(page);
  });

  await test.step('10. Settings → Reset progress → confirm → map back to the start', async () => {
    await openFromMenu(page, 'Settings');
    await page.getByRole('button', { name: 'Reset progress' }).click();
    await page
      .getByRole('dialog', { name: 'Reset all progress?' })
      .getByRole('button', { name: 'Yes, reset' })
      .click();
    await page.goto('/map');
    await page
      .getByRole('dialog', { name: 'Tour with José Rizal' })
      .getByRole('button', { name: 'Skip tour' })
      .click();
    await expect(page).toHaveURL(/\/region\/philippines$/);
    await expect(page.getByRole('link', { name: 'Enter Calamba ▶' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Passport · 0\/25/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guided' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
