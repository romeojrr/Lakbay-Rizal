// Test helper: answers the question on screen the way a player would (tap, then Check).
import { screen, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import type { Question } from '../content/schemas';

type User = ReturnType<typeof userEvent.setup>;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const button = (text: string) =>
  screen.getByRole('button', { name: new RegExp(`^${escape(text)}`) });
const check = (user: User) => user.click(screen.getByRole('button', { name: 'Check' }));

/** The content question whose prompt is showing. */
export function currentQuestion(questions: readonly Question[]): Question {
  const prompt = document.getElementById('quiz-prompt')?.textContent ?? '';
  const question = questions.find((q) => q.prompt === prompt);
  if (!question) throw new Error(`no question with prompt "${prompt}"`);
  return question;
}

export async function answerRight(user: User, question: Question): Promise<void> {
  switch (question.type) {
    case 'mcq':
      await user.click(button(question.options.find((o) => o.id === question.answer)?.text ?? ''));
      return;
    case 'multi':
      for (const id of question.answers) {
        await user.click(button(question.options.find((o) => o.id === id)?.text ?? ''));
      }
      await check(user);
      return;
    case 'order': {
      // Tap-to-swap until each position holds the right item.
      const list = screen.getByRole('list', { name: question.prompt });
      for (const [position, id] of question.answer.entries()) {
        const text = question.items.find((i) => i.id === id)?.text ?? '';
        const rows = within(list).getAllByRole('button');
        const from = rows.findIndex((row) => row.textContent?.includes(text));
        if (from !== position) {
          await user.click(rows[position] as HTMLElement);
          await user.click(within(list).getAllByRole('button')[from] as HTMLElement);
        }
      }
      await check(user);
      return;
    }
    case 'match':
      for (const [left, right] of Object.entries(question.pairs)) {
        await user.click(button(question.left.find((l) => l.id === left)?.text ?? ''));
        const rightText = question.right.find((r) => r.id === right)?.text ?? '';
        const column = screen.getByRole('list', { name: 'Matches' });
        await user.click(
          within(column).getByRole('button', { name: new RegExp(escape(rightText)) }),
        );
      }
      await check(user);
      return;
    case 'error':
      await user.click(button(question.segments.find((s) => s.id === question.answer)?.text ?? ''));
      return;
  }
}

/** A wrong answer: an mcq option or error segment that is not the answer. */
export async function answerWrong(user: User, question: Question): Promise<void> {
  if (question.type === 'mcq') {
    await user.click(button(question.options.find((o) => o.id !== question.answer)?.text ?? ''));
  } else if (question.type === 'error') {
    await user.click(button(question.segments.find((s) => s.id !== question.answer)?.text ?? ''));
  } else {
    throw new Error(`answerWrong supports mcq and error, not ${question.type}`);
  }
}
