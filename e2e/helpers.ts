import { expect, type Page } from '@playwright/test';

/**
 * Marks the intro (FR-4) as seen, so the v2.3 tour does not start, but only on a fresh
 * profile: once a save exists it is left alone, so reloads keep the test's progress.
 */
export async function skipIntroOnFreshProfile(page: Page) {
  await page.addInitScript(() => {
    const key = 'lakbay-rizal:v1';
    if (localStorage.getItem(key)) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        state: {
          version: 1,
          mode: 'guided',
          visited: [],
          completed: [],
          stamps: [],
          items: [],
          materials: { bamboo: 0, stone: 0, tools: 0 },
          builder: { school: false, clinic: false, water: false },
          seenIntro: true,
          // v2.3 tips would cover buttons for 8 s; tests of the tips clear this.
          seenTips: [
            'quiz-first',
            'passport-first',
            'journal-first',
            'builder-first',
            'gallery-first',
            'settings-first',
            'rank-up',
            'private-mode',
          ],
          settings: { textSize: 'normal', reduceMotion: 'system', showVerifyNotes: false },
        },
      }),
    );
  });
}

/**
 * Opens Settings, Credits or Scenes the way a player would at this width: from the header on
 * desktop (Settings is the gear; Credits is inside Settings), from the bottom navigation's
 * More menu on phones (v2.3 §5.5).
 */
export async function openFromMenu(page: Page, name: 'Settings' | 'Credits' | 'Scenes') {
  const bottomNav = page.getByRole('navigation', { name: 'Main' });
  if (await bottomNav.isVisible()) {
    await bottomNav.getByRole('button', { name: 'More' }).click();
    await page.getByRole('dialog', { name: 'More' }).getByRole('link', { name }).click();
    return;
  }
  const header = page.getByRole('banner');
  if (name === 'Credits') {
    await header.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('main').getByRole('link', { name: 'Credits' }).click();
    return;
  }
  await header.getByRole('link', { name }).click();
}

/** Sideways overflow of the page, or of the page area (which scrolls on its own). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    return Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      main ? main.scrollWidth - main.clientWidth : 0,
    );
  });
}

/** Reads to the end of the stop's story with the → key (there is no "Skip to the end"). */
export async function finishStory(page: Page) {
  // Wait for the story itself first: opening a stop from the map plays the Enter zoom (2.4 s)
  // before the stop page loads, and key presses sent during it were lost on the map. On a busy
  // machine that used up the presses below and the story never reached its end.
  await page.waitForURL(/\/stop\//);
  await expect(page.getByRole('region', { name: 'Story' })).toBeVisible({ timeout: 15_000 });
  const replay = page.getByRole('button', { name: 'Replay ↺' });
  // A few presses between checks: each step takes two (finish the typing, then move on).
  for (let i = 0; i < 60 && !(await replay.isVisible()); i++) {
    for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowRight');
  }
  await expect(replay).toBeVisible();
}

/** Plays the whole story with Next, as a player would (the first press finishes the typing). */
export async function playStory(page: Page) {
  const next = page.getByRole('button', { name: 'Next ▶' });
  while (await next.isVisible()) await next.click();
  await expect(page.getByRole('button', { name: 'Replay ↺' })).toBeVisible();
}
