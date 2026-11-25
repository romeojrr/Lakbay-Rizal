// U4 / FR-81: all five question types work in the browser — by mouse or touch (both
// projects), by keyboard alone, and order rows by dragging.
import { expect, test, type Page } from '@playwright/test';
import { expectNoSeriousA11yIssues } from './a11y';
import { horizontalOverflow, skipIntroOnFreshProfile } from './helpers';
import { playQuiz, quizOf } from './quiz';

test.beforeEach(async ({ page }) => {
  await skipIntroOnFreshProfile(page);
  // Free mode, every story already read, so any quiz opens.
  await page.addInitScript(() => {
    const key = 'lakbay-rizal:v1';
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as {
      state?: Record<string, unknown>;
    };
    if (saved.state && !(saved.state.visited as string[]).length) {
      saved.state = {
        ...saved.state,
        mode: 'free',
        visited: ['calamba-1861', 'dapitan-1892', 'hongkong-1891'],
      };
      localStorage.setItem(key, JSON.stringify(saved));
    }
  });
});

test('mcq, multi, order and error (Dapitan) and match (Hong Kong), by tap or click', async ({
  page,
}) => {
  await page.goto('/stop/dapitan-1892/quiz');
  await playQuiz(page, 'dapitan-1892', { wrongFirst: true });
  await expect(page.getByText(/^(Gold|Silver) stamp$/)).toBeVisible();

  await page.goto('/stop/hongkong-1891/quiz');
  await playQuiz(page, 'hongkong-1891');
  expect(await horizontalOverflow(page)).toBe(0);
});

/** Moves the focused, picked order row up or down with the keyboard until it is at `to`. */
async function keyboardOrder(
  page: Page,
  prompt: string,
  answer: string[],
  texts: Record<string, string>,
) {
  const list = page.getByRole('list', { name: prompt });
  for (const [position, id] of answer.entries()) {
    const rows = list.getByRole('button');
    const from = (await rows.allTextContents()).findIndex((t) => t.includes(texts[id] ?? '?'));
    await rows.nth(from).focus();
    await page.keyboard.press('Enter'); // pick it up
    for (let i = from; i > position; i--) await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter'); // put it down
  }
}

test('keyboard only: order (pick + arrows) and match (Enter on each side)', async ({ page }) => {
  // Calamba question 1 is "order".
  const [order] = quizOf('calamba-1861') as unknown as {
    prompt: string;
    answer: string[];
    items: { id: string; text: string }[];
  }[];
  if (!order) throw new Error('calamba quiz');
  await page.goto('/stop/calamba-1861/quiz');
  await expect(page.locator('#quiz-prompt')).toHaveText(order.prompt);
  const texts = Object.fromEntries(order.items.map((i) => [i.id, i.text]));
  await keyboardOrder(page, order.prompt, order.answer, texts);
  await page.getByRole('button', { name: 'Check' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Correct!' })).toBeFocused();
  await expectNoSeriousA11yIssues(page, 'quiz feedback (order)');

  // Hong Kong question 4 is "match".
  const match = quizOf('hongkong-1891')[3] as unknown as {
    prompt: string;
    left: { id: string; text: string }[];
    right: { id: string; text: string }[];
    pairs: Record<string, string>;
  };
  await page.goto('/stop/hongkong-1891/quiz');
  for (let i = 0; i < 3; i++) {
    const prompt = (await page.locator('#quiz-prompt').textContent()) ?? '';
    const q = quizOf('hongkong-1891').find((x) => x.prompt === prompt);
    if (!q) throw new Error(prompt);
    await playOneByClick(page, q);
  }
  await expect(page.locator('#quiz-prompt')).toHaveText(match.prompt);
  for (const [left, right] of Object.entries(match.pairs)) {
    const leftText = match.left.find((l) => l.id === left)?.text ?? '';
    const rightText = match.right.find((r) => r.id === right)?.text ?? '';
    await page
      .getByRole('list', { name: 'Names' })
      .getByRole('button', { name: new RegExp(`^${escapeRe(leftText)}`) })
      .focus();
    await page.keyboard.press('Enter');
    await page
      .getByRole('list', { name: 'Matches' })
      .getByRole('button', { name: new RegExp(escapeRe(rightText)) })
      .focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Check' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Correct!' })).toBeFocused();
  await expect(page.getByText(/^Source: /)).toBeVisible();
});

test('order rows can be dragged by their grip', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mouse drag');
  await page.goto('/stop/calamba-1861/quiz');
  const prompt = (quizOf('calamba-1861')[0]?.prompt as string) ?? '';
  const list = page.getByRole('list', { name: prompt });
  await expect(list.getByRole('button')).toHaveCount(4);
  const before = await list.getByRole('button').allTextContents();
  const grips = list.locator('li > span[aria-hidden="true"]');
  const from = await grips.nth(0).boundingBox();
  const to = await grips.nth(2).boundingBox();
  if (!from || !to) throw new Error('no grips');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  const after = await list.getByRole('button').allTextContents();
  expect(after[2]?.replace(/^\d/, '').slice(0, 20)).toBe(
    before[0]?.replace(/^\d/, '').slice(0, 20),
  );
});

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Answers one mcq/error/order question by clicking, and moves on. */
async function playOneByClick(page: Page, q: Record<string, unknown> & { type: string }) {
  const tap = (text: string) =>
    page.getByRole('button', { name: new RegExp(`^${escapeRe(text)}`) }).click();
  const find = (list: unknown, id: unknown) =>
    (list as { id: string; text: string }[]).find((c) => c.id === id)?.text ?? '';
  if (q.type === 'mcq') await tap(find(q.options, q.answer));
  else if (q.type === 'error') await tap(find(q.segments, q.answer));
  else if (q.type === 'order') {
    const list = page.getByRole('list', { name: q.prompt as string });
    for (const [position, id] of (q.answer as string[]).entries()) {
      const rows = list.getByRole('button');
      const from = (await rows.allTextContents()).findIndex((t) => t.includes(find(q.items, id)));
      if (from !== position) {
        await rows.nth(position).click();
        await rows.nth(from).click();
      }
    }
    await page.getByRole('button', { name: 'Check' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Correct!' })).toBeVisible();
  await page.getByRole('button', { name: 'Next question ▶' }).click();
}
