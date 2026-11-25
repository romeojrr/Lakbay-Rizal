// The player's progress (SRS §8.4), saved in localStorage under `lakbay-rizal:v1` (FR-70).
// A save that cannot be read is kept under `lakbay-rizal:v1:corrupt`, the game starts
// fresh, and the app shows a notice (§8.5).
import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { Stop } from '../content/schemas';
import type { JourneyMode } from '../content/selectors';
import { CURRENT_VERSION, migrateProgress, sanitizeProgress } from './migrations';

export const STORAGE_KEY = 'lakbay-rizal:v1';
export const CORRUPT_KEY = `${STORAGE_KEY}:corrupt`;

export interface Progress {
  version: 1;
  mode: JourneyMode;
  visited: string[];
  completed: string[];
  stamps: string[];
  items: string[];
  materials: { bamboo: number; stone: number; tools: number };
  builder: { school: boolean; clinic: boolean; water: boolean };
  seenIntro: boolean;
  newStamp?: string;
  settings: {
    textSize: 'normal' | 'large';
    reduceMotion: 'system' | 'on' | 'off';
    showVerifyNotes: boolean;
  };
}

export function initialProgress(): Progress {
  return {
    version: 1,
    mode: 'guided',
    visited: [],
    completed: [],
    stamps: [],
    items: [],
    materials: { bamboo: 0, stone: 0, tools: 0 },
    builder: { school: false, clinic: false, water: false },
    seenIntro: false,
    newStamp: undefined,
    settings: { textSize: 'normal', reduceMotion: 'system', showVerifyNotes: false },
  };
}

interface ProgressActions {
  setMode: (mode: JourneyMode) => void;
  /** GD-3: a stop is visited once its dialogue is finished. Safe to call twice. */
  visit: (stopId: string) => void;
  /**
   * GD-3 / GD-4: completes a stop and gives its stamp, item and materials once.
   * `quiet` (the final stop, GD-6) adds the stamp without the "New!" tag.
   * Returns true the first time, false if the stop was already completed.
   */
  complete: (stop: Stop, options?: { quiet?: boolean }) => boolean;
  /** FR-51: the "New!" tag goes once the passport has been opened. */
  markPassportSeen: () => void;
  /** Dapitan builder: marks a project built. The page checks the materials first. */
  build: (project: 'school' | 'clinic' | 'water') => void;
  /** "Restart builder": clears the projects only; stamps and materials stay (SRS §3.5). */
  resetBuilder: () => void;
  /** Starts again from nothing (Settings → Reset progress). */
  reset: () => void;
}

export type ProgressStore = Progress & ProgressActions;

// --- Storage ---------------------------------------------------------------

let loadProblem = false;

/** True once if the saved progress was damaged and had to be reset. */
export function consumeLoadProblem(): boolean {
  const had = loadProblem;
  loadProblem = false;
  return had;
}

function keepCorruptCopy(text: string) {
  loadProblem = true;
  try {
    localStorage.setItem(CORRUPT_KEY, text);
  } catch {
    // Storage full or blocked: nothing more we can do.
  }
}

const storage: PersistStorage<Progress> = {
  getItem(name) {
    let text: string | null;
    try {
      text = localStorage.getItem(name);
    } catch {
      return null; // private mode or blocked storage: play without saving
    }
    if (text === null) return null;
    try {
      const saved = JSON.parse(text) as Partial<StorageValue<unknown>>;
      const migrated = migrateProgress(saved.state, saved.version ?? 0);
      const state = sanitizeProgress(migrated, initialProgress());
      if (!state) throw new Error('unreadable progress');
      return { state, version: CURRENT_VERSION };
    } catch {
      keepCorruptCopy(text);
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Quota or private mode: progress lives for this visit only.
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

// --- Store -----------------------------------------------------------------

const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...initialProgress(),
      setMode: (mode) => set({ mode }),
      visit: (stopId) =>
        set((s) => (s.visited.includes(stopId) ? s : { visited: [...s.visited, stopId] })),
      complete: (stop, options = {}) => {
        const state = get();
        if (state.completed.includes(stop.id)) return false;
        const { item, materials = {} } = stop.rewards;
        set({
          visited: add(state.visited, stop.id),
          completed: [...state.completed, stop.id],
          stamps: add(state.stamps, stop.id),
          items: item ? add(state.items, item) : state.items,
          materials: {
            bamboo: state.materials.bamboo + (materials.bamboo ?? 0),
            stone: state.materials.stone + (materials.stone ?? 0),
            tools: state.materials.tools + (materials.tools ?? 0),
          },
          newStamp: options.quiet ? state.newStamp : stop.id,
        });
        return true;
      },
      markPassportSeen: () => set((s) => (s.newStamp === undefined ? s : { newStamp: undefined })),
      build: (project) => set((s) => ({ builder: { ...s.builder, [project]: true } })),
      resetBuilder: () => set({ builder: initialProgress().builder }),
      reset: () => set(initialProgress()),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_VERSION,
      storage,
      partialize: (s): Progress => ({
        version: s.version,
        mode: s.mode,
        visited: s.visited,
        completed: s.completed,
        stamps: s.stamps,
        items: s.items,
        materials: s.materials,
        builder: s.builder,
        seenIntro: s.seenIntro,
        newStamp: s.newStamp,
        settings: s.settings,
      }),
    },
  ),
);
