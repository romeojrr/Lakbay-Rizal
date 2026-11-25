// Zod schemas for content v3 (SRS v2.3 §6.2b, §3.7, §3.8, §3.10):
// stops.v3.json, guide.json, gamification.json and the Filipino files in i18n/.
// Like schemas.ts, objects are strict so a misspelled key fails validation.
import { z } from 'zod';
import {
  DATA_GUIDE_IDS,
  MOODS,
  QUESTION_TYPES,
  REACTION_KINDS,
  SKILLS,
  type FilContentFileName,
  type V3ContentFileName,
} from './constants';
import {
  AnchorSchema,
  MaterialsSchema,
  assetPath,
  count,
  percent,
  stopBase,
  text,
} from './schemas';

export const MoodSchema = z.enum(MOODS);
export const SkillSchema = z.enum(SKILLS);

const SourceIdSchema = z.strictObject({ sourceId: text });

export const LineSchema = z.strictObject({
  speaker: text,
  text,
  mood: MoodSchema,
  onScene: z.boolean(),
  /** Present only when the words are quoted from a published source. */
  recorded: SourceIdSchema.optional(),
});

export const ChapterSchema = z.strictObject({
  id: z.string().regex(/^c\d+$/, 'must look like c1, c2, …'),
  title: text.max(40, 'must be 40 characters or fewer'),
  camera: z.strictObject({
    x: percent,
    y: percent,
    zoom: z.number().min(1, 'must be 1 or more').max(1.6, 'must be 1.6 or less'),
  }),
  narration: z.array(text).min(1, 'needs at least 1 paragraph'),
  lines: z.array(LineSchema).max(4, 'use at most 4 lines per chapter'),
  fact: z.strictObject({ text, sourceId: text }).optional(),
});

const choice = z.strictObject({ id: text, text });
const questionBase = {
  id: text,
  skill: SkillSchema,
  prompt: text,
  explain: text,
  sourceId: text,
  hint: text,
};

export const McqSchema = z.strictObject({
  ...questionBase,
  type: z.literal('mcq'),
  options: z.array(choice).length(4, 'needs exactly 4 options'),
  answer: text,
});
export const MultiSchema = z.strictObject({
  ...questionBase,
  type: z.literal('multi'),
  options: z.array(choice).min(3, 'needs at least 3 options'),
  answers: z.array(text).min(2, 'needs at least 2 answers'),
});
export const OrderSchema = z.strictObject({
  ...questionBase,
  type: z.literal('order'),
  /** Listed in the correct order; the game shuffles them. */
  items: z.array(choice).min(3, 'needs 3 to 5 items').max(5, 'needs 3 to 5 items'),
  answer: z.array(text),
});
export const MatchSchema = z.strictObject({
  ...questionBase,
  type: z.literal('match'),
  left: z.array(choice),
  right: z.array(choice),
  pairs: z.record(z.string(), text),
});
export const ErrorQuestionSchema = z.strictObject({
  ...questionBase,
  type: z.literal('error'),
  segments: z.array(choice).min(2, 'needs at least 2 segments'),
  answer: text,
  correction: text,
});

export const QuestionSchema = z.discriminatedUnion('type', [
  McqSchema,
  MultiSchema,
  OrderSchema,
  MatchSchema,
  ErrorQuestionSchema,
]);

const sceneV3 = {
  time: text,
  alt: text,
  notes: z.array(text).max(3, 'use at most 3 notes').optional(),
  speakerAnchors: z.record(z.string(), AnchorSchema).optional(),
};

const v3Fields = {
  contentVersion: z.literal(3),
  /** Narration words, computed by the content script. */
  wordCount: count,
  story: text,
  /** Kept for the v2 "Dramatized" rule. */
  dialogue: z.strictObject({ dramatized: z.literal(true) }),
};

export const PlayableStopV3Schema = z.strictObject({
  ...stopBase,
  ...v3Fields,
  status: z.enum(['draft', 'verified']),
  scene: z.strictObject({ image: assetPath, ...sceneV3 }),
  chapters: z.array(ChapterSchema),
  quiz: z.array(QuestionSchema),
  rewards: z.strictObject({
    stamp: z.strictObject({ icon: assetPath }),
    item: text.optional(),
    materials: MaterialsSchema.optional(),
  }),
});

/** A placeholder stop the team is still writing (§6.2). */
export const OutlineStopV3Schema = z.strictObject({
  ...stopBase,
  ...v3Fields,
  status: z.literal('outline'),
  story: z.string(),
  scene: z.strictObject({
    image: assetPath.nullable(),
    time: z.string().nullable(),
    alt: z.string(),
    notes: z.array(z.string()).optional(),
    speakerAnchors: z.record(z.string(), AnchorSchema).optional(),
  }),
  chapters: z.array(ChapterSchema),
  quiz: z.array(QuestionSchema),
  rewards: z.strictObject({
    stamp: z.strictObject({ icon: assetPath.nullable() }),
    item: text.optional(),
    materials: MaterialsSchema.optional(),
  }),
});

export const StopV3Schema = z.discriminatedUnion('status', [
  PlayableStopV3Schema,
  OutlineStopV3Schema,
]);
export const StopsV3FileSchema = z.array(StopV3Schema);

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
  scene: z.strictObject({ alt: maybe, time: maybe }).optional(),
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

export type Mood = z.infer<typeof MoodSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Line = z.infer<typeof LineSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionType = Question['type'];
export type PlayableStopV3 = z.infer<typeof PlayableStopV3Schema>;
export type OutlineStopV3 = z.infer<typeof OutlineStopV3Schema>;
export type StopV3 = z.infer<typeof StopV3Schema>;
export type Guide = z.infer<typeof GuideFileSchema>;
export type Gamification = z.infer<typeof GamificationFileSchema>;
export type FilStop = z.infer<typeof FilStopSchema>;
export type FilStops = z.infer<typeof FilStopsFileSchema>;
export type FilGuide = z.infer<typeof FilGuideFileSchema>;
export type FilGamification = z.infer<typeof FilGamificationFileSchema>;

/** Content v3, after validation. */
export interface ContentV3 {
  'stops.v3': StopV3[];
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
  'stops.v3': StopsV3FileSchema,
  guide: GuideFileSchema,
  gamification: GamificationFileSchema,
} as const satisfies Record<V3ContentFileName, z.ZodType>;

export const FIL_FILE_SCHEMAS = {
  'i18n/fil.stops': FilStopsFileSchema,
  'i18n/fil.guide': FilGuideFileSchema,
  'i18n/fil.gamification': FilGamificationFileSchema,
} as const satisfies Record<FilContentFileName, z.ZodType>;

export { QUESTION_TYPES };
