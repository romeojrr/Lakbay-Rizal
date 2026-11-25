// Saved-progress versions and checks (SRS §8.4, §8.5, FR-70).
// To change the saved shape: bump CURRENT_VERSION, add a migration from the old version,
// and update `sanitizeProgress`. Old saves are upgraded step by step on load.
import type { Progress } from './progress';

export const CURRENT_VERSION = 1;

type Migration = (state: unknown) => unknown;

/** MIGRATIONS[n] upgrades a version-n save to version n + 1. None yet. */
export const MIGRATIONS: Record<number, Migration> = {};

/** Upgrades a saved state to CURRENT_VERSION, or returns null if that is not possible. */
export function migrateProgress(state: unknown, fromVersion: number): unknown {
  if (!Number.isInteger(fromVersion) || fromVersion < 1 || fromVersion > CURRENT_VERSION) {
    return null;
  }
  let current = state;
  for (let version = fromVersion; version < CURRENT_VERSION; version++) {
    const migration = MIGRATIONS[version];
    if (!migration) return null;
    current = migration(current);
  }
  return current;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const unique = (list: string[]) => [...new Set(list)];

/**
 * Checks a loaded save and returns a clean copy, or null when it is damaged.
 * Missing optional parts get their defaults; wrong types mean the save is damaged.
 */
export function sanitizeProgress(raw: unknown, defaults: Progress): Progress | null {
  if (!isObject(raw) || raw.version !== CURRENT_VERSION) return null;
  if (raw.mode !== 'guided' && raw.mode !== 'free') return null;
  for (const key of ['visited', 'completed', 'stamps', 'items'] as const) {
    if (!isStringArray(raw[key])) return null;
  }

  const materials = raw.materials ?? defaults.materials;
  if (
    !isObject(materials) ||
    !isCount(materials.bamboo) ||
    !isCount(materials.stone) ||
    !isCount(materials.tools)
  ) {
    return null;
  }
  const builder = raw.builder ?? defaults.builder;
  if (
    !isObject(builder) ||
    typeof builder.school !== 'boolean' ||
    typeof builder.clinic !== 'boolean' ||
    typeof builder.water !== 'boolean'
  ) {
    return null;
  }
  const settings = { ...defaults.settings, ...(isObject(raw.settings) ? raw.settings : {}) };
  if (
    (settings.textSize !== 'normal' && settings.textSize !== 'large') ||
    !['system', 'on', 'off'].includes(settings.reduceMotion) ||
    typeof settings.showVerifyNotes !== 'boolean'
  ) {
    return null;
  }
  if (raw.newStamp !== undefined && typeof raw.newStamp !== 'string') return null;
  if (raw.seenIntro !== undefined && typeof raw.seenIntro !== 'boolean') return null;

  return {
    version: CURRENT_VERSION,
    mode: raw.mode,
    visited: unique(raw.visited as string[]),
    completed: unique(raw.completed as string[]),
    stamps: unique(raw.stamps as string[]),
    items: unique(raw.items as string[]),
    materials: { bamboo: materials.bamboo, stone: materials.stone, tools: materials.tools },
    builder: { school: builder.school, clinic: builder.clinic, water: builder.water },
    seenIntro: raw.seenIntro ?? false,
    ...(raw.newStamp !== undefined ? { newStamp: raw.newStamp } : {}),
    settings,
  };
}
