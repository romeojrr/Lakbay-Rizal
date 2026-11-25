// The player's progress (SRS §8.4).
// M2: kept in memory only. Saving to localStorage (`lakbay-rizal:v1`), migrations and the
// reward actions arrive in M4.
import { create } from 'zustand';
import type { JourneyMode } from '../content/selectors';

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
    settings: { textSize: 'normal', reduceMotion: 'system', showVerifyNotes: false },
  };
}

interface ProgressActions {
  setMode: (mode: JourneyMode) => void;
  /** GD-3: a stop is visited once its dialogue is finished. Safe to call twice. */
  visit: (stopId: string) => void;
}

export const useProgress = create<Progress & ProgressActions>()((set) => ({
  ...initialProgress(),
  setMode: (mode) => set({ mode }),
  visit: (stopId) =>
    set((state) =>
      state.visited.includes(stopId) ? state : { visited: [...state.visited, stopId] },
    ),
}));
