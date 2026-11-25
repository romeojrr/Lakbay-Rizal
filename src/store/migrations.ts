// Saved-progress versions and checks (SRS §8.4, §8.5, FR-70).
// To change the saved shape: bump CURRENT_VERSION, add a migration from the old version,
// and update `sanitizeProgress`. Old saves are upgraded step by step on load.
import { isLang, type Lang } from '../i18n/language';
import type { Progress, StampGrade } from './progress';

export const CURRENT_VERSION = 2;

type Migration = (state: unknown) => unknown;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const unique = <T>(list: T[]) => [...new Set(list)];

/**
 * v1 (v2.2) → v2 (v2.3, §8.4). Everything the player has is kept. The new parts are left
 * out, so `sanitizeProgress` gives them their defaults: no XP or streak yet, the tour not
 * seen, stamps earned before v2.3 without a gold/silver grade, the browser's language
 * (§3.10), sound on and music off.
 */
export function migrateV1toV2(state: unknown): unknown {
  return isObject(state) ? { ...state, version: 2 } : state;
}

/** MIGRATIONS[n] upgrades a version-n save to version n + 1. */
export const MIGRATIONS: Record<number, Migration> = { 1: migrateV1toV2 };

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

/** A record of whole numbers (quiz stats, chapters read), or null if any value is wrong. */
function countRecord(value: unknown): Record<string, number> | null {
  if (!isObject(value)) return null;
  return Object.values(value).every(isCount) ? (value as Record<string, number>) : null;
}

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
    typeof settings.showVerifyNotes !== 'boolean' ||
    typeof settings.panelCollapsed !== 'boolean' ||
    !isLang(settings.lang) ||
    typeof settings.sound !== 'boolean' ||
    typeof settings.music !== 'boolean' ||
    typeof settings.volume !== 'number' ||
    !(settings.volume >= 0 && settings.volume <= 1) ||
    typeof settings.autoplay !== 'boolean'
  ) {
    return null;
  }
  if (raw.newStamp !== undefined && typeof raw.newStamp !== 'string') return null;
  if (raw.seenIntro !== undefined && typeof raw.seenIntro !== 'boolean') return null;

  // --- v2.3 parts ---
  const xp = raw.xp ?? defaults.xp;
  const streak = raw.streak ?? defaults.streak;
  const bestStreak = raw.bestStreak ?? defaults.bestStreak;
  if (!isCount(xp) || !isCount(streak) || !isCount(bestStreak)) return null;

  const stampGrade = raw.stampGrade ?? defaults.stampGrade;
  if (!isObject(stampGrade)) return null;
  if (!Object.values(stampGrade).every((g) => g === 'gold' || g === 'silver')) return null;

  const quizStats = raw.quizStats ?? defaults.quizStats;
  if (!isObject(quizStats)) return null;
  const typeCorrect = countRecord(quizStats.typeCorrect ?? {});
  const skillCorrect = countRecord(quizStats.skillCorrect ?? {});
  const chaptersRead = countRecord(raw.chaptersRead ?? defaults.chaptersRead);
  if (!typeCorrect || !skillCorrect || !chaptersRead) return null;

  const lists = {
    readMoreOpened: raw.readMoreOpened ?? defaults.readMoreOpened,
    achievements: raw.achievements ?? defaults.achievements,
    perfectStops: raw.perfectStops ?? defaults.perfectStops,
    seenTips: raw.seenTips ?? defaults.seenTips,
  };
  if (!Object.values(lists).every(isStringArray)) return null;

  const tourDone = raw.tourDone ?? defaults.tourDone;
  if (typeof tourDone !== 'boolean') return null;

  const readIn = raw.readIn ?? defaults.readIn;
  if (!isObject(readIn)) return null;
  if (!Object.values(readIn).every((langs) => Array.isArray(langs) && langs.every(isLang))) {
    return null;
  }

  const save = { ...defaults.save, ...(isObject(raw.save) ? raw.save : {}) };
  if (
    typeof save.remindersOn !== 'boolean' ||
    (save.lastExportAt !== undefined && typeof save.lastExportAt !== 'string') ||
    (save.persisted !== undefined && typeof save.persisted !== 'boolean')
  ) {
    return null;
  }
  if (raw.certificateName !== undefined && typeof raw.certificateName !== 'string') return null;

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
    xp,
    streak,
    bestStreak,
    stampGrade: stampGrade as Record<string, StampGrade>,
    quizStats: { typeCorrect, skillCorrect },
    chaptersRead,
    readMoreOpened: unique(lists.readMoreOpened as string[]),
    achievements: unique(lists.achievements as string[]),
    perfectStops: unique(lists.perfectStops as string[]),
    seenTips: unique(lists.seenTips as string[]),
    tourDone,
    readIn: Object.fromEntries(
      Object.entries(readIn as Record<string, Lang[]>).map(([id, langs]) => [id, unique(langs)]),
    ),
    save,
    ...(raw.certificateName !== undefined ? { certificateName: raw.certificateName } : {}),
    settings,
  };
}
