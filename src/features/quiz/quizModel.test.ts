// FR-81 / FR-82: every question type is checked by id; shuffles never give away the answer.
import { describe, expect, it } from 'vitest';
import type { Question } from '../../content/schemas';
import { realContent } from '../../test/content';
import { isCorrect, prepare, stampGrade, type QuestionResult } from './quizModel';

const questions = realContent().stops.flatMap((s) => s.quiz);
const first = <T extends Question['type']>(type: T) => {
  const found = questions.find((q) => q.type === type);
  if (!found) throw new Error(type);
  return found as Extract<Question, { type: T }>;
};

/** A seeded random, so shuffles are repeatable. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

describe('the quiz has every type (§6.2b)', () => {
  it('120 questions of all five types', () => {
    expect(questions).toHaveLength(120);
    expect(new Set(questions.map((q) => q.type))).toEqual(
      new Set(['mcq', 'multi', 'order', 'match', 'error']),
    );
  });
});

describe('isCorrect (by id)', () => {
  it('mcq: the answer id only', () => {
    const q = first('mcq');
    expect(isCorrect(q, { type: 'mcq', pick: q.answer })).toBe(true);
    const wrong = q.options.find((o) => o.id !== q.answer)?.id ?? '';
    expect(isCorrect(q, { type: 'mcq', pick: wrong })).toBe(false);
  });

  it('multi: exactly the answers, in any order', () => {
    const q = first('multi');
    expect(isCorrect(q, { type: 'multi', picks: [...q.answers].reverse() })).toBe(true);
    expect(isCorrect(q, { type: 'multi', picks: q.answers.slice(1) })).toBe(false);
    expect(isCorrect(q, { type: 'multi', picks: q.options.map((o) => o.id) })).toBe(false);
  });

  it('order: the ids in the right order', () => {
    const q = first('order');
    expect(isCorrect(q, { type: 'order', order: q.answer })).toBe(true);
    expect(isCorrect(q, { type: 'order', order: [...q.answer].reverse() })).toBe(false);
  });

  it('match: every pair', () => {
    const q = first('match');
    expect(isCorrect(q, { type: 'match', pairs: { ...q.pairs } })).toBe(true);
    const [a, b] = Object.keys(q.pairs);
    const swapped = {
      ...q.pairs,
      [a as string]: q.pairs[b as string] as string,
      [b as string]: q.pairs[a as string] as string,
    };
    expect(isCorrect(q, { type: 'match', pairs: swapped })).toBe(false);
    const missing = Object.fromEntries(Object.entries(q.pairs).filter(([left]) => left !== a));
    expect(isCorrect(q, { type: 'match', pairs: missing })).toBe(false);
  });

  it('error: the wrong segment', () => {
    const q = first('error');
    expect(isCorrect(q, { type: 'error', pick: q.answer })).toBe(true);
    const other = q.segments.find((s) => s.id !== q.answer)?.id ?? '';
    expect(isCorrect(q, { type: 'error', pick: other })).toBe(false);
  });

  it('an answer of another type is never right', () => {
    const q = first('mcq');
    expect(isCorrect(q, { type: 'error', pick: q.answer })).toBe(false);
  });
});

describe('prepare (FR-82)', () => {
  it('shuffles options, items and the right column, keeping every id', () => {
    for (const q of questions) {
      const p = prepare(q, seeded(7));
      if (q.type === 'mcq' || q.type === 'multi') {
        expect(p.type === q.type && new Set(p.options.map((o) => o.id))).toEqual(
          new Set(q.options.map((o) => o.id)),
        );
      }
      if (q.type === 'match' && p.type === 'match') {
        expect(p.left).toEqual(q.left);
        expect(new Set(p.right.map((r) => r.id))).toEqual(new Set(q.right.map((r) => r.id)));
      }
      if (q.type === 'error') expect(p).toEqual(q);
    }
  });

  it('an order question never starts already in the right order', () => {
    const orders = questions.filter((q) => q.type === 'order');
    expect(orders.length).toBeGreaterThan(0);
    for (const q of orders) {
      for (const random of [seeded(1), seeded(42), () => 0, () => 0.999999]) {
        const p = prepare(q, random);
        if (p.type !== 'order' || q.type !== 'order') throw new Error('type');
        expect(p.items.map((i) => i.id)).not.toEqual(q.answer);
        expect(new Set(p.items.map((i) => i.id))).toEqual(new Set(q.answer));
      }
    }
  });

  it('gives a different order on different attempts', () => {
    const q = first('mcq');
    const orders = new Set(
      [1, 2, 3, 4, 5, 6].map((seed) => {
        const p = prepare(q, seeded(seed));
        return p.type === 'mcq' ? p.options.map((o) => o.id).join() : '';
      }),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe('stampGrade (§3.8)', () => {
  const result = (attempts: number): QuestionResult => ({
    id: `q${attempts}`,
    type: 'mcq',
    skill: 'recall',
    attempts,
    hintOpened: false,
  });

  it('gold for 4 or 5 of 5 right on the first try, silver otherwise', () => {
    expect(stampGrade([1, 1, 1, 1, 1].map(result))).toBe('gold');
    expect(stampGrade([1, 1, 1, 1, 2].map(result))).toBe('gold');
    expect(stampGrade([1, 1, 1, 2, 3].map(result))).toBe('silver');
    expect(stampGrade([])).toBe('silver');
  });

  it('scales for other question counts', () => {
    expect(stampGrade([1, 1].map(result))).toBe('gold');
    expect(stampGrade([1, 2].map(result))).toBe('silver');
  });
});
