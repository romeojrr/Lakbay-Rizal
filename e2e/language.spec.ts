// U2 / FR-86 (SRS v2.3 §3.10, §12b step 7): English or Filipino (in Settings) with per-string
// fallback; the choice is saved. Also: a v2.2 (version 1) save is upgraded.
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { horizontalOverflow, skipIntroOnFreshProfile } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

// calamba-1861's map card, from stops.json and i18n/fil.stops.json.
const EN_TEASER = 'A house by the lake, and a mother who teaches';
const FIL_TEASER = 'Isang bahay sa tabi ng lawa, at isang inang nagtuturo';
const FIL_ALT =
  'Binabasahan ni Teodora Alonso ang batang si José sa harap ng bahay na bato ng pamilya';

/** The language choice is in Settings (the gear in the top bar). */
async function chooseLanguage(page: Page, which: 'Filipino' | 'English') {
  await page.getByRole('banner').getByRole('link', { name: 'Settings' }).click();
  const radios = page.getByRole('main').getByRole('radio');
  await (which === 'Filipino' ? radios.nth(1) : radios.nth(0)).click();
  await expect(page.locator('html')).toHaveAttribute('lang', which === 'Filipino' ? 'fil' : 'en');
  await page.goBack();
}

test('switches to Filipino in Settings and back without a reload; the choice is saved', async ({
  page,
}) => {
  await page.goto('/region/philippines');
  await expect(page.getByText(EN_TEASER)).toBeVisible();
  // The top bar has no language switch any more.
  await expect(page.getByRole('banner').getByRole('group', { name: 'Language' })).toHaveCount(0);
  // Mark the page: a reload would lose this.
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));

  await chooseLanguage(page, 'Filipino');

  // UI strings and content text are Filipino; the page was not reloaded.
  await expect(page).toHaveURL(/\/region\/philippines$/);
  await expect(page.getByText(FIL_TEASER)).toBeVisible();
  await expect(page.getByRole('img', { name: FIL_ALT })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
  // The translation is reviewed: no "Draft translation" badge.
  await expect(page.getByRole('button', { name: 'Draft translation' })).toHaveCount(0);
  expect(await horizontalOverflow(page)).toBe(0);
  await expectNoSeriousA11yIssues(page, 'map in Filipino');

  // Saved: a reload opens in Filipino straight away.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await expect(page.getByText(FIL_TEASER)).toBeVisible();

  await chooseLanguage(page, 'English');
  await expect(page.getByText(EN_TEASER)).toBeVisible();
});

test('strings without a Filipino version fall back to English', async ({ page }) => {
  await page.goto('/settings');
  // The language changes once the Filipino files are loaded, so click and wait.
  await page.getByRole('main').getByRole('radio', { name: 'Filipino' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await expect(page.getByRole('main').getByRole('group', { name: 'Wika' })).toBeVisible();
  // "Same as my device" has no Filipino string yet: it shows in English.
  await expect(page.getByRole('radio', { name: 'Same as my device' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('radio', { name: 'Filipino' })).toBeFocused();
  await expectNoSeriousA11yIssues(page, 'settings in Filipino');
});

test('a browser set to Filipino starts in Filipino', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: 'fil-PH', baseURL });
  const page = await context.newPage();
  await skipIntroOnFreshProfile(page);
  await page.goto('/region/philippines');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await expect(page.getByText(FIL_TEASER)).toBeVisible();
  await context.close();
});

test('a version-1 save keeps its stamps and is saved again as version 2 (§8.4)', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const key = 'lakbay-rizal:v1';
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      state?: Record<string, unknown>;
      version?: number;
    };
    if (saved.version !== 1 || saved.state?.stamps?.toString()) return;
    saved.state = {
      ...saved.state,
      visited: ['calamba-1861'],
      completed: ['calamba-1861'],
      stamps: ['calamba-1861'],
      items: ['moth-story'],
    };
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.goto('/passport');
  await expect(page.getByRole('heading', { level: 1, name: 'Passport' })).toBeVisible();
  await expect(page.getByText('1 of 25')).toBeVisible();
  // Any change saves the upgraded shape.
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Large' }).check();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lakbay-rizal:v1') ?? '{}'),
  );
  expect(saved.version).toBe(3);
  expect(saved.state).toMatchObject({
    version: 3,
    stamps: ['calamba-1861'],
    items: ['moth-story'],
    xp: 0,
    tourDone: false,
    settings: { textSize: 'large', lang: 'en', sound: true, music: true },
  });
});
