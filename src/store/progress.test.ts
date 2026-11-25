import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { realContent } from '../test/content';
import { sanitizeProgress } from './migrations';
import {
  consumeLoadProblem,
  CORRUPT_KEY,
  initialProgress,
  STORAGE_KEY,
  useProgress,
} from './progress';

const { stops } = realContent();
const stop = (id: string) => {
  const found = stops.find((s) => s.id === id);
  if (!found) throw new Error(id);
  return found;
};

beforeEach(() => {
  localStorage.clear();
  useProgress.setState(initialProgress());
  consumeLoadProblem();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('complete (GD-4)', () => {
  it('gives the stamp, item and materials once', () => {
    const berlin = stop('berlin-1887');
    expect(useProgress.getState().complete(berlin)).toBe(true);
    expect(useProgress.getState().complete(berlin)).toBe(false);

    const s = useProgress.getState();
    expect(s.completed).toEqual(['berlin-1887']);
    expect(s.visited).toEqual(['berlin-1887']);
    expect(s.stamps).toEqual(['berlin-1887']);
    expect(s.items).toEqual(['noli-me-tangere']);
    expect(s.materials).toEqual({ bamboo: 2, stone: 2, tools: 0 });
    expect(s.newStamp).toBe('berlin-1887');
  });

  it('the final stop adds its stamp quietly, without "New!" (GD-6)', () => {
    useProgress.getState().complete(stop('bagumbayan-1896'), { quiet: true });
    const s = useProgress.getState();
    expect(s.stamps).toEqual(['bagumbayan-1896']);
    expect(s.newStamp).toBeUndefined();
  });

  it('opening the passport clears "New!" (FR-51)', () => {
    useProgress.getState().complete(stop('berlin-1887'));
    useProgress.getState().markPassportSeen();
    expect(useProgress.getState().newStamp).toBeUndefined();
  });

  it('reset starts again from nothing', () => {
    useProgress.getState().complete(stop('berlin-1887'));
    useProgress.getState().setMode('free');
    useProgress.getState().reset();
    expect(useProgress.getState()).toMatchObject(initialProgress());
  });
});

describe('saving (FR-70)', () => {
  it('saves to localStorage and loads it back', async () => {
    useProgress.getState().complete(stop('berlin-1887'));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.version).toBe(1);
    expect(saved.state.stamps).toEqual(['berlin-1887']);
    expect(saved.state).not.toHaveProperty('complete');

    useProgress.setState(initialProgress(), false); // still saves; restore the file below
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    await useProgress.persist.rehydrate();
    expect(useProgress.getState().stamps).toEqual(['berlin-1887']);
    expect(useProgress.getState().items).toEqual(['noli-me-tangere']);
  });

  it('keeps a copy of a damaged save, starts fresh and reports it once', async () => {
    localStorage.setItem(STORAGE_KEY, '{"state": broken');
    await useProgress.persist.rehydrate();
    expect(useProgress.getState().stamps).toEqual([]);
    expect(localStorage.getItem(CORRUPT_KEY)).toBe('{"state": broken');
    expect(consumeLoadProblem()).toBe(true);
    expect(consumeLoadProblem()).toBe(false);
  });

  it('treats a save with the wrong shape as damaged', async () => {
    const bad = { state: { ...initialProgress(), stamps: 'berlin' }, version: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bad));
    await useProgress.persist.rehydrate();
    expect(useProgress.getState().stamps).toEqual([]);
    expect(consumeLoadProblem()).toBe(true);
  });

  it('rejects saves from a newer, unknown version', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: initialProgress(), version: 99 }));
    await useProgress.persist.rehydrate();
    expect(consumeLoadProblem()).toBe(true);
  });

  it('keeps playing when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await useProgress.persist.rehydrate();
    expect(() => useProgress.getState().complete(stop('berlin-1887'))).not.toThrow();
    expect(useProgress.getState().stamps).toEqual(['berlin-1887']);
    expect(consumeLoadProblem()).toBe(false);
  });
});

describe('sanitizeProgress', () => {
  it('fills missing optional parts with defaults and removes duplicates', () => {
    const partial: Record<string, unknown> = { ...initialProgress(), stamps: ['a', 'a'] };
    delete partial.settings;
    delete partial.builder;
    const clean = sanitizeProgress(partial, initialProgress());
    expect(clean?.stamps).toEqual(['a']);
    expect(clean?.settings).toEqual(initialProgress().settings);
    expect(clean?.builder).toEqual(initialProgress().builder);
  });

  it('rejects negative materials and unknown modes', () => {
    const base = initialProgress();
    expect(
      sanitizeProgress({ ...base, materials: { bamboo: -1, stone: 0, tools: 0 } }, base),
    ).toBeNull();
    expect(sanitizeProgress({ ...base, mode: 'fast' }, base)).toBeNull();
  });
});
