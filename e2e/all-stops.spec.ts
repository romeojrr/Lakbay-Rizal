// M7 "done when": every stop plays end to end in preview mode (a build with drafts).
// Plays all 25 stops in Guided order straight from content, so the unlock order,
// dialogue, quizzes, builder, final stop and rewards are all exercised.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { finishStory, horizontalOverflow, skipIntroOnFreshProfile } from './helpers';

interface SeedStop {
  id: string;
  order: number;
  year: number;
  builder?: boolean;
  place: { label: string };
  quiz: { prompt: string; answer: string; options: { id: string; text: string }[] }[];
}

const stops = (JSON.parse(readFileSync('public/content/stops.json', 'utf8')) as SeedStop[]).sort(
  (a, b) => a.order - b.order,
);

/** Every image on the page has loaded (scenes, sprites, portraits, stamps, item icons). */
async function expectImagesLoaded(page: Page, where: string) {
  await page.waitForFunction(() => [...document.images].every((img) => img.complete));
  const broken = await page.evaluate(() =>
    [...document.images].filter((img) => img.naturalWidth === 0).map((img) => img.src),
  );
  expect(broken, `broken images on ${where}`).toEqual([]);
}

async function playDialogue(page: Page, stop: SeedStop) {
  await expect(
    page.getByRole('heading', { level: 1, name: `${stop.place.label} · ${stop.year}` }),
  ).toBeVisible();
  await expectImagesLoaded(page, stop.id);
  await finishStory(page);
}

async function playQuiz(page: Page, stop: SeedStop) {
  await page.getByRole('link', { name: 'Quiz ▶', exact: true }).click();
  for (let i = 0; i < stop.quiz.length; i++) {
    const prompt = (await page.locator('#quiz-prompt').textContent()) ?? '';
    const question = stop.quiz.find((q) => q.prompt === prompt);
    expect(question, `${stop.id}: unknown question "${prompt}"`).toBeDefined();
    const answer = question?.options.find((o) => o.id === question.answer)?.text ?? '';
    const group = page.getByRole('group', { name: prompt });
    await group.getByRole('button', { name: answer, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Correct!' })).toBeVisible();
    const last = i === stop.quiz.length - 1;
    await page
      .getByRole('button', { name: last ? 'See your reward ▶' : 'Next question ▶' })
      .click();
  }
  await expect(page.getByRole('heading', { name: 'Stop complete!' })).toBeVisible();
  await expect(page.getByText(`${stop.place.label} stamp`, { exact: false })).toBeVisible();
}

async function playBuilder(page: Page) {
  await page.getByRole('link', { name: 'Build the town ▶' }).click();
  await expectImagesLoaded(page, 'builder');
  await page.getByRole('button', { name: 'Build the Clinic' }).click();
  await page.getByRole('button', { name: 'Build the Water system' }).click();
  await expect(page.getByText('Dapitan stamp earned!')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
});

test('all 25 stops play end to end in Guided order (M7)', async ({ page }) => {
  test.setTimeout(300_000);
  expect(stops).toHaveLength(25);

  for (const [index, stop] of stops.entries()) {
    await test.step(`${stop.order}. ${stop.id}`, async () => {
      await page.goto(`/stop/${stop.id}`);
      await playDialogue(page, stop);
      if (stop.builder) await playBuilder(page);
      else if (stop.quiz.length > 0) await playQuiz(page, stop);
      else await expect(page.getByRole('heading', { name: 'Epilogue' })).toBeVisible();

      await expect(page.getByRole('link', { name: `Passport · ${index + 1}/25` })).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  await test.step('passport: 25 of 25, every theme badge complete', async () => {
    await page.goto('/passport');
    await expect(page.getByText('25 of 25')).toBeVisible();
    await expect(page.getByText('?', { exact: true })).toHaveCount(0);
    await expect(page.getByText(', complete')).toHaveCount(5);
    await expectImagesLoaded(page, 'passport');
  });

  await test.step('journal: every keepsake', async () => {
    await page.goto('/journal');
    await expect(page.getByText('24 of 24 keepsakes', { exact: false })).toBeVisible();
    await expectImagesLoaded(page, 'journal');
  });

  await test.step('scene gallery: all 25 scenes unlocked in Guided mode', async () => {
    await page.goto('/scenes');
    await expect(
      page.getByRole('navigation', { name: 'Choose a scene' }).getByRole('button'),
    ).toHaveCount(25);
    await expectImagesLoaded(page, 'gallery');
  });

  await test.step('every region map shows its stops as done', async () => {
    for (const [region, count] of [
      ['philippines', 9],
      ['asia', 2],
      ['europe', 13],
      ['america', 1],
    ] as const) {
      await page.goto(`/region/${region}`);
      await expectImagesLoaded(page, region);
      const journey = page.getByRole('heading', { name: 'Journey' }).locator('..');
      await expect(journey.getByText('Done', { exact: true })).toHaveCount(count);
    }
  });
});
