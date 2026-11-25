// SRS v2.3 quiz rules (§6.2b, FR-81, FR-82, §3.8): shuffle per attempt, check by id, grade.
import type { Question } from '../../content/schemas';
import { shuffle } from '../../lib/shuffle';

/** What the player answered, by question type. Everything is ids, never text. */
export type Answer =
  | { type: 'mcq'; pick: string }
  | { type: 'multi'; picks: string[] }
  | { type: 'order'; order: string[] }
  | { type: 'match'; pairs: Record<string, string> }
  | { type: 'error'; pick: string };

/**
 * FR-82: a fresh order for one attempt. Options, order items and the right-hand match column
 * are shuffled; an order question never starts already solved. The left match column and the
 * "spot the error" sentence keep their order (the sentence must read as a sentence).
 */
export function prepare(question: Question, random: () => number = Math.random): Question {
  switch (question.type) {
    case 'mcq':
    case 'multi':
      return { ...question, options: shuffle(question.options, random) };
    case 'order':
      return { ...question, items: unsolvedShuffle(question.items, question.answer, random) };
    case 'match':
      return { ...question, right: shuffle(question.right, random) };
    case 'error':
      return question;
  }
}

function unsolvedShuffle<T extends { id: string }>(
  items: readonly T[],
  answer: readonly string[],
  random: () => number,
): T[] {
  if (items.length < 2) return [...items];
  const solved = (list: readonly T[]) => list.map((item) => item.id).join() === answer.join();
  let result = shuffle(items, random);
  for (let tries = 0; solved(result) && tries < 10; tries++) result = shuffle(items, random);
  if (solved(result)) {
    // Still solved (a fixed `random` in tests): swap the first two.
    const [first, second, ...rest] = result as [T, T, ...T[]];
    result = [second, first, ...rest];
  }
  return result;
}

/** Checks an answer by id (FR-82). */
export function isCorrect(question: Question, answer: Answer): boolean {
  if (question.type !== answer.type) return false;
  switch (answer.type) {
    case 'mcq':
      return question.type === 'mcq' && answer.pick === question.answer;
    case 'multi': {
      if (question.type !== 'multi') return false;
      const picks = new Set(answer.picks);
      return (
        picks.size === question.answers.length && question.answers.every((id) => picks.has(id))
      );
    }
    case 'order':
      return question.type === 'order' && answer.order.join() === question.answer.join();
    case 'match': {
      if (question.type !== 'match') return false;
      const expected = Object.entries(question.pairs);
      return (
        Object.keys(answer.pairs).length === expected.length &&
        expected.every(([left, right]) => answer.pairs[left] === right)
      );
    }
    case 'error':
      return question.type === 'error' && answer.pick === question.answer;
  }
}

/** One question's result, for the stamp grade and (U5) XP. */
export interface QuestionResult {
  id: string;
  type: Question['type'];
  skill: Question['skill'];
  /** Tries until it was right (1 = first try). */
  attempts: number;
  hintOpened: boolean;
}

/** §3.8: gold if at least 4 of 5 were right on the first try (the same share for other counts). */
export function stampGrade(
  results: readonly QuestionResult[],
  rule = { minCorrectFirstTry: 4, outOf: 5 },
): 'gold' | 'silver' {
  const firstTry = results.filter((r) => r.attempts === 1).length;
  const needed = Math.ceil((results.length * rule.minCorrectFirstTry) / rule.outOf);
  return results.length > 0 && firstTry >= needed ? 'gold' : 'silver';
}
