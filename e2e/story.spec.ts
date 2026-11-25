// U3 / FR-80 (SRS v2.3 §3.6): the chapter story player, played on Calamba in the browser.
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { finishStory, horizontalOverflow, skipIntroOnFreshProfile } from './helpers';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

const next = (page: Page) => page.getByRole('button', { name: 'Next ▶' });

/** Presses Next until `heading` (a chapter title card) shows. */
async function nextUntilChapter(page: Page, title: string) {
  const heading = page.getByRole('heading', { level: 2, name: title });
  for (let i = 0; i < 40 && !(await heading.isVisible()); i++) await next(page).click();
  await expect(heading).toBeVisible();
}

test('Calamba plays 4 chapters: camera, typing close-ups, Recorded tag (FR-80)', async ({
  page,
}) => {
  await page.goto('/stop/calamba-1861');
  const player = page.getByRole('region', { name: 'Story' });
  await expect(page.getByRole('heading', { level: 1, name: 'Calamba · 1861' })).toBeVisible();
  await expect(player.getByText('Chapter 1 of 4').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'A house by the lake' })).toBeVisible();
  await expect(page.getByText('Quiz ▶')).toHaveAttribute('aria-disabled', 'true');

  // Narration types out: the first press shows it all, the second moves on.
  await next(page).click();
  const typed = player.locator('[data-step="narration"] p > span').first();
  await next(page).click();
  const paragraph = await typed.textContent();
  expect(paragraph).toMatch(/^José Protasio Rizal Mercado y Alonso Realonda/);
  expect(paragraph).toMatch(/watches over the town\.$/);

  // Chapter 3: the camera moves to Teodora (zoom 1.6).
  await nextUntilChapter(page, 'The young moth');
  const camera = player.locator('[data-zoom]');
  await expect(camera).toHaveAttribute('data-zoom', '1.6');
  await expect
    .poll(() => camera.evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/^matrix\(1\.6, 0, 0, 1\.6, /);

  // Her portrait talks while the line types, then rests; the moth line is Recorded.
  await next(page).click(); // paragraph 1
  await next(page).click();
  await next(page).click(); // paragraph 2
  await next(page).click();
  await next(page).click(); // the line starts typing
  const portrait = page.getByRole('img', { name: 'Portrait of Teodora Alonso, happy' });
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute('data-frame', 'talk');
  await expect(portrait).toHaveAttribute('data-frame', /idle|blink/, { timeout: 5000 });
  const recorded = page.getByRole('button', { name: 'Recorded' });
  await recorded.click();
  await expect(
    page.getByRole('tooltip', { name: /Real words, from a published source\./ }),
  ).toBeVisible();
  await expect(page.getByText('…')).toBeVisible();
  expect(await horizontalOverflow(page)).toBe(0);
  await expectNoSeriousA11yIssues(page, 'story player, a Recorded line');

  // Keyboard: ← back, → next.
  await page.keyboard.press('ArrowLeft');
  await expect(portrait).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(portrait).toBeVisible();

  await finishStory(page);
  await expect(page.getByRole('link', { name: 'Take the quiz ▶' })).toHaveAttribute(
    'href',
    '/stop/calamba-1861/quiz',
  );
  await expect(page.getByRole('link', { name: 'Quiz ▶', exact: true })).toBeVisible();
});

test('reduced motion: text appears at once and the camera cuts with a fade (§5.6)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/stop/calamba-1861');
  await next(page).click();
  const typed = page.locator('[data-step="narration"] p > span').first();
  await expect(typed).toHaveText(/^José Protasio Rizal Mercado y Alonso Realonda.*\.$/);
  await expect(page.locator('[data-zoom]')).toHaveClass(/motion-fade/);
});

test('Read more: summary, then and today, date and sources (FR-33)', async ({ page }) => {
  await page.goto('/region/europe');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.getByRole('link', { name: 'Berlin, 1887, open' }).click();
  await expect(page).toHaveURL(/\/stop\/berlin-1887$/);

  // A modal dialog; Esc closes it and focus returns to the button.
  const readMore = page.getByRole('button', { name: 'Read more' });
  await readMore.click();
  const dialog = page.getByRole('dialog', { name: 'The Noli is printed' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Berlin, Germany')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused(); // focus stays inside
  // Story keys do nothing while the dialog is open.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(readMore).toBeFocused();
  await expect(
    page.getByRole('heading', { level: 2, name: 'The capital of science' }),
  ).toBeVisible();

  // FR-3: back returns to the map the player came from.
  await page.getByRole('link', { name: '◀ Back to map' }).click();
  await expect(page).toHaveURL(/\/region\/europe$/);
});

test('the text box sits below the scene on small screens, over it on wide ones', async ({
  page,
}, testInfo) => {
  await page.goto('/stop/calamba-1861');
  const scene = await page.getByRole('img', { name: /Teodora Alonso reads/ }).boundingBox();
  const box = await page.locator('[data-step]').boundingBox();
  expect(scene && box).toBeTruthy();
  const overlap = (scene?.y ?? 0) + (scene?.height ?? 0) - (box?.y ?? 0);
  if (testInfo.project.name === 'mobile') expect(overlap).toBeLessThanOrEqual(0);
  else expect(overlap).toBeGreaterThan(0);
});
