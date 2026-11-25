import type { Page } from '@playwright/test';

/**
 * Marks the intro (FR-4) as seen, but only on a fresh profile: once a save exists it is
 * left alone, so reloads keep the test's progress.
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
          settings: { textSize: 'normal', reduceMotion: 'system', showVerifyNotes: false },
        },
      }),
    );
  });
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
