import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle (FR-44)', () => {
  it('keeps every item exactly once and does not change the input', () => {
    const input = ['a', 'b', 'c', 'd'];
    const out = shuffle(input);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual(['a', 'b', 'c', 'd']);
  });

  it('uses the random source given', () => {
    expect(shuffle(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a']);
    expect(shuffle(['a', 'b', 'c', 'd'], () => 0.999)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('produces different orders over many runs', () => {
    const seen = new Set(Array.from({ length: 200 }, () => shuffle([1, 2, 3, 4]).join('')));
    expect(seen.size).toBeGreaterThan(10);
  });
});
