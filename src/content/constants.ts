// Plain constants shared by the schemas, loader and selectors.
// Kept free of Zod so the production bundle does not include it.

export const THEMES = ['study', 'travel', 'writing', 'cause', 'exile'] as const;
export const REGION_IDS = ['philippines', 'asia', 'europe', 'america'] as const;
export const MATERIALS = ['bamboo', 'stone', 'tools'] as const;
export const BUILDER_PROJECTS = ['school', 'clinic', 'water'] as const;

/** The files in public/content/ the game loads on start, without the .json extension. */
export const CONTENT_FILES = [
  'stops',
  'regions',
  'characters',
  'items',
  'builder',
  'sources',
] as const;

export type ContentFileName = (typeof CONTENT_FILES)[number];

/** v2.3 files beside the stops (SRS §6.1): the guide (U6) and gamification (U5). */
export const V3_CONTENT_FILES = ['guide', 'gamification'] as const;
export type V3ContentFileName = (typeof V3_CONTENT_FILES)[number];

/** The Filipino content (§3.10), loaded only when the player picks Filipino. */
export const FIL_CONTENT_FILES = [
  'i18n/fil.stops',
  'i18n/fil.guide',
  'i18n/fil.gamification',
] as const;
export type FilContentFileName = (typeof FIL_CONTENT_FILES)[number];

// --- Content v3 (§6.2b) ---------------------------------------------------------

export const MOODS = ['neutral', 'happy', 'sad', 'serious', 'surprised', 'thinking'] as const;
export const SKILLS = ['recall', 'chronology', 'cause', 'analysis', 'source'] as const;
export const QUESTION_TYPES = ['mcq', 'multi', 'order', 'match', 'error'] as const;

/** §7.10: 4 columns (idle, blink, talk, talk) × 6 rows (one per mood) of 64 px frames. */
export const PORTRAIT_SHEET = { w: 256, h: 384, frame: 64 } as const;

/** §3.7: the elements the guide's tour can point at. */
export const DATA_GUIDE_IDS = [
  'map',
  'region-tabs',
  'timeline',
  'mode-toggle',
  'pin-current',
  'scene',
  'line-tag',
  'sources-card',
  'quiz-button',
  'xp-bar',
  'passport-button',
  'save-indicator',
] as const;

/** §3.7: the one-time tips the game shows. guide.json must have each of them. */
export const GUIDE_TIPS = [
  'quiz-first',
  'passport-first',
  'journal-first',
  'builder-first',
  'gallery-first',
  'settings-first',
  'private-mode',
  'rank-up',
] as const;

export const REACTION_KINDS = ['correct', 'wrong', 'streak', 'perfect'] as const;
