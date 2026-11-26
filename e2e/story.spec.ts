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

test('Calamba plays 4 chapters: typing text, Recorded tag, no close-ups (FR-80)', async ({
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

  // Chapter 3: the whole scene stays in view (no camera zoom, no close-ups).
  await nextUntilChapter(page, 'The young moth');
  const camera = player.locator('[data-zoom]');
  await expect(camera).toHaveAttribute('data-zoom', '1');
  // The narration (long paragraphs come as two pages), then her line.
  const line = player.locator('[data-step="line"]');
  for (let i = 0; i < 16 && !(await line.isVisible()); i++) await next(page).click();
  await expect(player.getByText('Teodora Alonso')).toBeVisible();
  await expect(page.getByRole('img', { name: /^Portrait of/ })).toHaveCount(0);
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
  await expect(recorded).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(recorded).toBeVisible();

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
  await page.goBack(); // the browser's back button (there is no Back to map button)
  await expect(page).toHaveURL(/\/region\/europe$/);
});

test('the dialogue box: inside the scene frame on wide screens, under it on phones', async ({
  page,
}, testInfo) => {
  await page.goto('/stop/calamba-1861');
  const picture = await page.getByRole('img', { name: /Teodora Alonso reads/ }).boundingBox();
  const frame = await page.locator('[data-guide="scene"]').boundingBox();
  const box = await page.locator('[data-step]').boundingBox();
  expect(picture && frame && box).toBeTruthy();
  if (!picture || !frame || !box) return;
  const overlap = picture.y + picture.height - box.y;
  if (testInfo.project.name === 'desktop') {
    // Inside the frame, over only the last strip of the picture (the ground, not the people).
    expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
    expect(overlap).toBeGreaterThan(0);
    expect(overlap).toBeLessThanOrEqual(40);
    // A long paragraph (Calamba's second, ~600 letters) gets smaller text, not a taller box.
    const step = page.locator('[data-step]');
    const titleBox = await step.locator('..').boundingBox();
    await page.getByRole('button', { name: 'Next' }).click(); // paragraph 1 (typing)
    await page.getByRole('button', { name: 'Next' }).click(); // shows it all
    await page.getByRole('button', { name: 'Next' }).click(); // paragraph 2
    await expect(step).toContainText('seventh');
    const longBox = await step.locator('..').boundingBox();
    expect(Math.abs((longBox?.y ?? 0) - (titleBox?.y ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((longBox?.height ?? 0) - (titleBox?.height ?? 0))).toBeLessThanOrEqual(1);
    const size = await step
      .locator('p')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
    expect(await step.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  } else {
    expect(overlap).toBeLessThanOrEqual(0);
  }
});

test('wide screens: the scene frame is the same size as the map frame', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'two columns only on wide screens');
  await page.goto('/region/philippines');
  const map = await page.locator('[data-guide="map"]').boundingBox();
  await page.goto('/stop/calamba-1861');
  const scene = await page.locator('[data-guide="scene"]').boundingBox();
  expect(map && scene).toBeTruthy();
  // [data-guide=map] includes the wood frame; [data-guide=scene] is the picture inside it.
  expect(Math.abs((scene?.x ?? 0) - (map?.x ?? 0))).toBeLessThanOrEqual(12);
  expect(Math.abs((scene?.width ?? 0) - (map?.width ?? 0))).toBeLessThanOrEqual(24);
  expect(Math.abs((scene?.height ?? 0) - (map?.height ?? 0))).toBeLessThanOrEqual(24);
});
