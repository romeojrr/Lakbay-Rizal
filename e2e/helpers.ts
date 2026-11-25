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

/**
 * Opens Settings, Credits or Scenes the way a player would at this width: from the header
 * and footer on desktop, from the bottom navigation's More menu on phones (v2.3 §5.5).
 */
export async function openFromMenu(page: Page, name: 'Settings' | 'Credits' | 'Scenes') {
  const bottomNav = page.getByRole('navigation', { name: 'Main' });
  if (await bottomNav.isVisible()) {
    await bottomNav.getByRole('button', { name: 'More' }).click();
    await page.getByRole('dialog', { name: 'More' }).getByRole('link', { name }).click();
    return;
  }
  const where = name === 'Scenes' ? page.getByRole('banner') : page.getByRole('contentinfo');
  await where.getByRole('link', { name }).click();
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
