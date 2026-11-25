// U2 / FR-86 (SRS v2.3 §3.10, §12b step 7): EN | FIL switch with per-string fallback and the
// "Draft translation" badge; the choice is saved. Also: a v2.2 (version 1) save is upgraded.
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

const languageGroup = (page: Page) =>
  page.getByRole('banner').getByRole('group', { name: /^(Language|Wika)$/ });

test('switches to Filipino and back without a reload; the choice is saved', async ({ page }) => {
  await page.goto('/region/philippines');
  await expect(page.getByText(EN_TEASER)).toBeVisible();
  // Mark the page: a reload would lose this.
  await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));

  await languageGroup(page).getByRole('button', { name: 'FIL (Filipino)' }).click();

  // UI strings and content text are Filipino; the page was not reloaded.
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await expect(page.getByText(FIL_TEASER)).toBeVisible();
  await expect(page.getByRole('img', { name: FIL_ALT })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
  await expect(languageGroup(page).getByRole('button', { name: 'FIL (Filipino)' })).toBeFocused();

  // Draft badge with its tooltip.
  const badge = page.getByRole('banner').getByRole('button', { name: 'Draft translation' });
  await expect(badge).toBeVisible();
  await badge.click();
  await expect(page.getByRole('tooltip')).toHaveText(
    'Written by AI, being checked by the RIZLIFE team.',
  );
  expect(await horizontalOverflow(page)).toBe(0);
  await expectNoSeriousA11yIssues(page, 'map in Filipino');

  // Saved: a reload opens in Filipino straight away.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await expect(page.getByText(FIL_TEASER)).toBeVisible();

  await languageGroup(page).getByRole('button', { name: 'EN (English)' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText(EN_TEASER)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Draft translation' })).toHaveCount(0);
});

test('strings without a Filipino version fall back to English', async ({ page }) => {
  await page.goto('/settings');
  // The language changes once the Filipino files are loaded, so click and wait.
  await page.getByRole('main').getByRole('radio', { name: 'Filipino' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await expect(page.getByRole('main').getByRole('group', { name: 'Wika' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Show verify notes (team)' })).toBeVisible();
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
