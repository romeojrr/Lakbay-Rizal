// SRS v2.3 §12b: the v2.3 journey, end to end. Steps 1, 5, 6 and 7 are covered in depth by
// m6/tour, save and language specs; this file walks the whole path once per viewport, and
// adds the reduced-motion check (step 9) and the quiet final stop (step 10).
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { finishStory, horizontalOverflow } from './helpers';
import { playQuiz } from './quiz';

async function playCalamba(page: Page) {
  // 2. Calamba: 4 chapters; chapter 3 shows the whole scene; her moth line is Recorded.
  await page.goto('/stop/calamba-1861');
  const next = page.getByRole('button', { name: 'Next ▶' });
  const moth = page.getByRole('heading', { level: 2, name: 'The young moth' });
  for (let i = 0; i < 40 && !(await moth.isVisible()); i++) await next.click();
  await expect(page.locator('[data-zoom]')).toHaveAttribute('data-zoom', '1');
  for (
    let i = 0;
    i < 16 && !(await page.getByRole('button', { name: 'Recorded' }).isVisible());
    i++
  ) {
    await next.click();
  }
  await expect(page.getByRole('button', { name: 'Recorded' })).toBeVisible();
  await finishStory(page);

  // 3–4. The quiz, a wrong answer first; XP goes up; gold stamp; first-steps toast.
  await page.getByRole('link', { name: 'Take the quiz ▶' }).click();
  await playQuiz(page, 'calamba-1861', { wrongFirst: true });
  await expect(page.getByText('Gold stamp')).toBeVisible();
  await expect(page.getByText('First steps').first()).toBeVisible();
  await expect(page.getByRole('banner').getByText(/^\d+ XP$/)).not.toHaveText('0 XP');
  await page.getByRole('link', { name: 'Open passport ▶' }).click();
  await expect(page.getByText('Gold', { exact: true })).toBeVisible();
  expect(await horizontalOverflow(page)).toBe(0);
}

test('§12b 1–4: landing, tour, Calamba story, quiz, gold stamp', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /MAGLAKBAY/ }).click();
  await expect(page).toHaveURL(/\/region\/philippines$/);
  const tour = page.getByRole('dialog', { name: 'Tour with José Rizal' });
  for (let n = 1; n <= 3; n++) {
    await expect(tour.getByText(`Step ${n} of 14`)).toBeVisible();
    if (n < 3) await tour.getByRole('button', { name: 'Next' }).click();
  }
  await tour.getByRole('button', { name: 'Skip tour' }).click();
  await expect(tour).toHaveCount(0);
  await playCalamba(page);
});

test('§12b 8: the same at 740 × 360 landscape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one landscape run is enough');
  await page.setViewportSize({ width: 740, height: 360 });
  await page.goto('/map');
  await page
    .getByRole('dialog', { name: 'Tour with José Rizal' })
    .getByRole('button', { name: 'Skip tour' })
    .click();
  await playCalamba(page);
});

test('§12b 9: reduced motion — no transform animations run', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/map');
  await page
    .getByRole('dialog', { name: 'Tour with José Rizal' })
    .getByRole('button', { name: 'Skip tour' })
    .click();
  const moving = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .filter(
          (el) => !el.classList.contains('motion-fade') && !el.classList.contains('motion-ok'),
        )
        .filter((el) => getComputedStyle(el).animationName !== 'none')
        .map((el) => `${el.tagName}.${el.className}`),
    );
  expect(await moving()).toEqual([]); // the map, with its pulsing current pin
  await page.goto('/stop/binan-1869');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await moving()).toEqual([]); // a stop with rain
});

test('§12b 10: the final stop — no quiz, no guide, no sparkles; the Epilogue', async ({ page }) => {
  await page.goto('/map');
  await page
    .getByRole('dialog', { name: 'Tour with José Rizal' })
    .getByRole('button', { name: 'Skip tour' })
    .click();
  await page.goto('/region/philippines');
  await page.getByRole('button', { name: 'Free explore' }).click();
  await page.goto('/stop/bagumbayan-1896');
  await expect(page.getByRole('button', { name: 'Auto-play' })).toHaveCount(0);
  await finishStory(page);
  await expect(page.getByRole('heading', { name: 'Epilogue' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Take the quiz ▶' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Tour with José Rizal' })).toHaveCount(0);
  await expect(page.locator('[class*="sparkles"], [class*="layer"] > span')).toHaveCount(0);
  await expectNoSeriousA11yIssues(page, 'final stop');
});
