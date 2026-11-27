// Zod schemas for the v2.3 content files (SRS §3.7, §3.8, §3.10): guide.json,
// gamification.json and the Filipino files in i18n/. Stops (§6.2b) are in schemas.ts.
// Like schemas.ts, objects are strict so a misspelled key fails validation.
import { z } from 'zod';
import {
  DATA_GUIDE_IDS,
  QUESTION_TYPES,
  REACTION_KINDS,
  type FilContentFileName,
  type V3ContentFileName,
} from './constants';
import {
  MoodSchema,
  text,
  type Chapter,
  type Line,
  type Mood,
  type OutlineStop,
  type PlayableStop,
  type Question,
  type QuestionType,
  type Skill,
  type Stop,
} from './schemas';

// Content v3 stops live in stops.json now (schemas.ts); these names stay for readability.
export type { Chapter, Line, Mood, Question, QuestionType, Skill };
export type StopV3 = Stop;
export type PlayableStopV3 = PlayableStop;
export type OutlineStopV3 = OutlineStop;

// --- guide.json (§3.7) ----------------------------------------------------------

const said = z.strictObject({ mood: MoodSchema, text });

export const GuideFileSchema = z.strictObject({
  _readme: z.string().optional(),
  /** The character who guides: their portrait is used. */
  speaker: text,
  tour: z.array(
    z.strictObject({
      id: text,
      route: z.string().regex(/^\//, 'must be a path starting with /'),
      target: z.enum(DATA_GUIDE_IDS).nullable(),
      mood: MoodSchema,
      next: z.enum(['button', 'click-target']),
      text,
    }),
  ),
  tips: z.record(z.string(), said),
  reactions: z.strictObject(
    Object.fromEntries(REACTION_KINDS.map((kind) => [kind, z.array(said).min(1)])) as Record<
      (typeof REACTION_KINDS)[number],
      z.ZodArray<typeof said>
    >,
  ),
});

// --- gamification.json (§3.8) ---------------------------------------------------

const points = z.number().int().min(0);

export const GamificationFileSchema = z.strictObject({
  _readme: z.string().optional(),
  xp: z.strictObject({
    correctFirstTry: points,
    correctSecondTry: points,
    correctLaterTry: points,
    hintPenalty: points,
    streakBonusEvery: z.number().int().min(1),
    streakBonus: points,
    perfectStopBonus: points,
    chapterRead: points,
    readMoreOpened: points,
    builderProject: points,
  }),
  quizPass: z.strictObject({
    minCorrectFirstTry: z.number().int().min(0),
    outOf: z.number().int().min(1),
    note: z.string().optional(),
  }),
  ranks: z
    .array(z.strictObject({ id: text, minXp: points, title: text, meaning: text }))
    .min(1, 'needs at least 1 rank'),
  achievements: z.array(
    z.strictObject({
      id: text,
      /** An item id from items.json, or null for no icon. */
      icon: text.nullable(),
      title: text,
      desc: text,
      rule: text,
      /** GD-6: no toast and no sound. */
      quiet: z.boolean().optional(),
    }),
  ),
});

// --- Filipino content (§3.10) ---------------------------------------------------
// Every string may be missing or empty: the game then shows the English one (per string).

const translationStatus = { lang: z.literal('fil'), status: z.enum(['draft', 'reviewed']) };
const maybe = z.string().optional();
const strings = z.array(z.string()).optional();

export const FilStopSchema = z.strictObject({
  title: maybe,
  teaser: maybe,
  story: maybe,
  dateLabel: maybe,
  place: z.strictObject({ then: maybe, today: maybe }).optional(),
  scene: z
    .strictObject({
      alt: maybe,
      time: maybe,
      places: z.record(z.string(), z.strictObject({ label: maybe, alt: maybe })).optional(),
    })
    .optional(),
  chapters: z
    .array(
      z.strictObject({
        title: maybe,
        narration: strings,
        lines: strings,
        fact: maybe,
      }),
    )
    .optional(),
  quiz: z
    .array(
      z.strictObject({
        prompt: maybe,
        explain: maybe,
        hint: maybe,
        options: strings,
        items: strings,
        left: strings,
        right: strings,
        segments: strings,
        correction: maybe,
      }),
    )
    .optional(),
});

export const FilStopsFileSchema = z.strictObject({
  _readme: z.string().optional(),
  ...translationStatus,
  stops: z.record(z.string(), FilStopSchema),
  items: z.record(z.string(), z.strictObject({ name: maybe, desc: maybe })).optional(),
  characters: z.record(z.string(), z.string()).optional(),
  builder: z.record(z.string(), z.string()).optional(),
  regions: z.record(z.string(), z.string()).optional(),
});

export const FilGuideFileSchema = z.strictObject({
  _readme: z.string().optional(),
  ...translationStatus,
  tour: z.record(z.string(), z.string()).optional(),
  tips: z.record(z.string(), z.string()).optional(),
  reactions: z.record(z.string(), z.array(z.string())).optional(),
});

export const FilGamificationFileSchema = z.strictObject({
  _readme: z.string().optional(),
  ...translationStatus,
  achievements: z.record(z.string(), z.strictObject({ title: maybe, desc: maybe })).optional(),
  /** Rank id → the rank's meaning in Filipino (the titles are already Filipino words). */
  ranks: z.record(z.string(), z.string()).optional(),
});

export type Guide = z.infer<typeof GuideFileSchema>;
export type Gamification = z.infer<typeof GamificationFileSchema>;
export type FilStop = z.infer<typeof FilStopSchema>;
export type FilStops = z.infer<typeof FilStopsFileSchema>;
export type FilGuide = z.infer<typeof FilGuideFileSchema>;
export type FilGamification = z.infer<typeof FilGamificationFileSchema>;

/** guide.json and gamification.json, after validation. */
export interface ContentV3 {
  guide: Guide;
  gamification: Gamification;
}

/** The Filipino files, after validation. */
export interface FilContent {
  'i18n/fil.stops': FilStops;
  'i18n/fil.guide': FilGuide;
  'i18n/fil.gamification': FilGamification;
}

export const V3_FILE_SCHEMAS = {
  guide: GuideFileSchema,
  gamification: GamificationFileSchema,
} as const satisfies Record<V3ContentFileName, z.ZodType>;

export const FIL_FILE_SCHEMAS = {
  'i18n/fil.stops': FilStopsFileSchema,
  'i18n/fil.guide': FilGuideFileSchema,
  'i18n/fil.gamification': FilGamificationFileSchema,
} as const satisfies Record<FilContentFileName, z.ZodType>;

export { QUESTION_TYPES };
