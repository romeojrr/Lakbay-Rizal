// NFR-2 / SRS §12 step 12: axe on every screen — no serious or critical issues.
import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { skipIntroOnFreshProfile } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
  // Free mode and a finished Berlin and Dapitan story, so every screen has content.
  await page.addInitScript(() => {
    const key = 'lakbay-rizal:v1';
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      state?: Record<string, unknown>;
    };
    if (saved.state && !saved.state.a11ySeeded) {
      saved.state = {
        ...saved.state,
        mode: 'free',
        visited: ['berlin-1887', 'dapitan-1892'],
        completed: ['calamba-1861'],
        stamps: ['calamba-1861'],
        items: ['moth-story'],
        newStamp: 'calamba-1861',
        a11ySeeded: true,
      };
      localStorage.setItem(key, JSON.stringify(saved));
    }
  });
});

const PAGES: [string, string, string][] = [
  ['Philippines map', '/region/philippines', 'Philippines'],
  ['Europe map', '/region/europe', 'Europe'],
  ['Asia map', '/region/asia', 'Asia'],
  ['America map', '/region/america', 'America'],
  ['stop', '/stop/berlin-1887', 'Berlin · 1887'],
  ['quiz', '/stop/berlin-1887/quiz', 'Berlin Quiz'],
  ['passport', '/passport', 'Passport'],
  ['journal', '/journal', 'Journal'],
  ['builder', '/dapitan/build', 'Dapitan'],
  ['scene gallery', '/scenes', 'Scene gallery'],
  ['settings', '/settings', 'Settings'],
  ['credits', '/credits', 'Credits'],
  ['404', '/nowhere', 'Page not found'],
];

for (const [name, path, heading] of PAGES) {
  test(`axe: ${name}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeAttached();
    await expectNoSeriousA11yIssues(page, name);
  });
}

test('axe: quiz after a wrong answer, and the Read more dialog', async ({ page }) => {
  await page.goto('/stop/berlin-1887/quiz');
  await page.getByRole('group', { name: /\?$/ }).getByRole('button').first().click();
  await expectNoSeriousA11yIssues(page, 'quiz feedback');

  await page.goto('/stop/berlin-1887');
  await page.getByRole('button', { name: 'Read more' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoSeriousA11yIssues(page, 'read more dialog');
});
