// Plays a stop's quiz in the browser from public/content/stops.json, like a player would:
// tap for mcq and error, tap then Check for multi, swap rows for order, pair for match.
import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

interface Choice {
  id: string;
  text: string;
}
type Question = { prompt: string; type: string } & Record<string, unknown>;
interface QuizStop {
  id: string;
  quiz: Question[];
}

const stops = JSON.parse(readFileSync('public/content/stops.json', 'utf8')) as QuizStop[];

export function quizOf(stopId: string): Question[] {
  const stop = stops.find((s) => s.id === stopId);
  if (!stop) throw new Error(`no stop ${stopId}`);
  return stop.quiz;
}

const textOf = (list: unknown, id: unknown) =>
  (list as Choice[]).find((c) => c.id === id)?.text ?? '';
const startsWith = (text: string) => new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

async function current(page: Page, quiz: Question[]): Promise<Question> {
  const prompt = (await page.locator('#quiz-prompt').textContent()) ?? '';
  const question = quiz.find((q) => q.prompt === prompt);
  expect(question, `unknown question "${prompt}"`).toBeDefined();
  return question as Question;
}

async function answerRight(page: Page, q: Question) {
  const tap = (text: string) => page.getByRole('button', { name: startsWith(text) }).click();
  const check = () => page.getByRole('button', { name: 'Check' }).click();
  switch (q.type) {
    case 'mcq':
    case 'error':
      await tap(textOf(q.type === 'mcq' ? q.options : q.segments, q.answer));
      return;
    case 'multi':
      for (const id of q.answers as string[]) await tap(textOf(q.options, id));
      await check();
      return;
    case 'order': {
      const list = page.getByRole('list', { name: q.prompt });
      for (const [position, id] of (q.answer as string[]).entries()) {
        const rows = list.getByRole('button');
        const texts = await rows.allTextContents();
        const from = texts.findIndex((t) => t.includes(textOf(q.items, id)));
        if (from !== position) {
          await rows.nth(position).click();
          await rows.nth(from).click();
        }
      }
      await check();
      return;
    }
    case 'match':
      for (const [left, right] of Object.entries(q.pairs as Record<string, string>)) {
        await tap(textOf(q.left, left));
        await page
          .getByRole('list', { name: 'Matches' })
          .getByRole('button', {
            name: new RegExp(textOf(q.right, right).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
          })
          .click();
      }
      await check();
      return;
  }
}

/**
 * Answers every question right; with `wrongFirst`, the first mcq or error question is
 * answered wrong once (hint, Try again). Ends on the reward card.
 */
export async function playQuiz(page: Page, stopId: string, { wrongFirst = false } = {}) {
  const quiz = quizOf(stopId);
  let wrongDone = !wrongFirst;
  for (let i = 0; i < quiz.length; i++) {
    const q = await current(page, quiz);
    if (!wrongDone && (q.type === 'mcq' || q.type === 'error')) {
      const list = (q.type === 'mcq' ? q.options : q.segments) as Choice[];
      const wrong = list.find((c) => c.id !== q.answer)?.text ?? '';
      await page.getByRole('button', { name: startsWith(wrong) }).click();
      await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
      await page.getByRole('button', { name: 'Show hint' }).click();
      await expect(page.getByText(/^Hint: /)).toBeVisible();
      await page.getByRole('button', { name: 'Try again' }).click();
      wrongDone = true;
    }
    await answerRight(page, q);
    await expect(page.getByRole('heading', { name: 'Correct!' })).toBeVisible();
    const last = i === quiz.length - 1;
    await page
      .getByRole('button', { name: last ? 'See your reward ▶' : 'Next question ▶' })
      .click();
  }
  await expect(page.getByRole('heading', { name: 'Stop complete!' })).toBeVisible();
}
