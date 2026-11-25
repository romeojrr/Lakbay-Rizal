import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { realContent } from '../test/content';
import { migrateProgress, sanitizeProgress } from './migrations';
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
    useProgress.getState().setSettings({ textSize: 'large', lang: 'fil' });
    useProgress.getState().reset();
    // Settings are the player's choices, not progress: they stay.
    expect(useProgress.getState()).toMatchObject({
      ...initialProgress(),
      settings: { ...initialProgress().settings, textSize: 'large', lang: 'fil' },
    });
  });
});

describe('saving (FR-70)', () => {
  it('saves to localStorage and loads it back', async () => {
    useProgress.getState().complete(stop('berlin-1887'));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.version).toBe(3);
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
    const bad = { state: { ...initialProgress(), stamps: 'berlin' }, version: 3 };
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

describe('markRead (SRS v2.3 §3.10)', () => {
  it('notes each language a stop was read in, once', () => {
    const { markRead } = useProgress.getState();
    markRead('calamba-1861', 'en');
    markRead('calamba-1861', 'en');
    markRead('calamba-1861', 'fil');
    expect(useProgress.getState().readIn).toEqual({ 'calamba-1861': ['en', 'fil'] });
  });
});

// A version-1 save exactly as the v2.2 game wrote it.
const V1_SAVE = {
  version: 1,
  state: {
    version: 1,
    mode: 'free',
    visited: ['calamba-1861', 'binan-1869'],
    completed: ['calamba-1861'],
    stamps: ['calamba-1861'],
    items: ['moth-story'],
    materials: { bamboo: 2, stone: 0, tools: 0 },
    builder: { school: false, clinic: false, water: false },
    seenIntro: true,
    newStamp: 'calamba-1861',
    settings: {
      textSize: 'large',
      reduceMotion: 'on',
      showVerifyNotes: true,
      panelCollapsed: true,
    },
  },
};

describe('store version 3 (SRS v2.3 §8.4; music on by default)', () => {
  it('a version-2 save gets music switched on, and keeps everything else', () => {
    const v2 = {
      ...initialProgress(),
      version: 2,
      xp: 120,
      settings: { ...initialProgress().settings, music: false },
    };
    const migrated = sanitizeProgress(migrateProgress(v2, 2), initialProgress());
    expect(migrated).toMatchObject({ version: 3, xp: 120, settings: { music: true } });
  });

  it('upgrades a version-1 save, keeping everything the player had', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(V1_SAVE));
    await useProgress.persist.rehydrate();
    const state = useProgress.getState();
    expect(consumeLoadProblem()).toBe(false);
    expect(state).toMatchObject({
      version: 3,
      mode: 'free',
      visited: ['calamba-1861', 'binan-1869'],
      completed: ['calamba-1861'],
      stamps: ['calamba-1861'],
      items: ['moth-story'],
      materials: { bamboo: 2, stone: 0, tools: 0 },
      seenIntro: true,
      newStamp: 'calamba-1861',
      // New in v2.3: nothing earned yet.
      xp: 0,
      streak: 0,
      bestStreak: 0,
      stampGrade: {},
      quizStats: { typeCorrect: {}, skillCorrect: {} },
      chaptersRead: {},
      readMoreOpened: [],
      achievements: [],
      seenTips: [],
      tourDone: false,
      readIn: {},
      save: { remindersOn: true },
      settings: {
        textSize: 'large',
        reduceMotion: 'on',
        showVerifyNotes: true,
        panelCollapsed: true,
        lang: 'en',
        sound: true,
        music: true,
        volume: 0.7,
        autoplay: false,
      },
    });
    // The next save is written as version 3.
    useProgress.getState().visit('ateneo-1872');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').version).toBe(3);
  });

  it('gives an upgraded save the browser language (§3.10)', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fil-PH', 'en']);
    const migrated = migrateProgress(V1_SAVE.state, 1);
    expect(sanitizeProgress(migrated, initialProgress())?.settings.lang).toBe('fil');
  });

  it('starts new players in the browser language', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['tl']);
    expect(initialProgress().settings.lang).toBe('fil');
  });

  it('rejects damaged v2.3 parts', () => {
    const base = initialProgress();
    expect(sanitizeProgress({ ...base, xp: -5 }, base)).toBeNull();
    expect(
      sanitizeProgress({ ...base, stampGrade: { 'calamba-1861': 'bronze' } }, base),
    ).toBeNull();
    expect(sanitizeProgress({ ...base, readIn: { 'calamba-1861': ['es'] } }, base)).toBeNull();
    expect(
      sanitizeProgress(
        { ...base, quizStats: { typeCorrect: { mcq: 1.5 }, skillCorrect: {} } },
        base,
      ),
    ).toBeNull();
    expect(
      sanitizeProgress({ ...base, settings: { ...base.settings, lang: 'es' } }, base),
    ).toBeNull();
    expect(
      sanitizeProgress({ ...base, settings: { ...base.settings, volume: 2 } }, base),
    ).toBeNull();
  });

  it('keeps valid v2.3 parts and removes duplicates', () => {
    const base = initialProgress();
    const clean = sanitizeProgress(
      {
        ...base,
        xp: 420,
        stampGrade: { 'calamba-1861': 'gold' },
        achievements: ['first-steps', 'first-steps'],
        readIn: { 'calamba-1861': ['en', 'fil', 'en'] },
        save: { remindersOn: false, lastExportAt: '2026-11-25T08:00:00.000Z' },
        certificateName: 'Juan',
      },
      base,
    );
    expect(clean).toMatchObject({
      xp: 420,
      stampGrade: { 'calamba-1861': 'gold' },
      achievements: ['first-steps'],
      readIn: { 'calamba-1861': ['en', 'fil'] },
      save: { remindersOn: false, lastExportAt: '2026-11-25T08:00:00.000Z' },
      certificateName: 'Juan',
    });
  });

  it('cannot migrate from version 0 or skip to an unknown version', () => {
    expect(migrateProgress(V1_SAVE.state, 0)).toBeNull();
    expect(migrateProgress(V1_SAVE.state, 4)).toBeNull();
  });
});
