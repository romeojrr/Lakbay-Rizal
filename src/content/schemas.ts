// Zod schemas for public/content/*.json — SRS §6.2, with v2.3 §6.2b stops (chapters, quiz).
// Objects are strict so a misspelled key fails validation instead of being ignored.
import { z } from 'zod';
import {
  BUILDER_PROJECTS,
  CONTENT_FILES,
  MATERIALS,
  MOODS,
  REGION_IDS,
  SKILLS,
  THEMES,
  type ContentFileName,
} from './constants';

export { BUILDER_PROJECTS, CONTENT_FILES, MATERIALS, REGION_IDS, THEMES, type ContentFileName };

export const text = z.string().trim().min(1, 'must not be empty');
// Folder names have no dots, so a path cannot climb out of /assets/ with "..".
export const assetPath = z
  .string()
  .regex(
    /^\/assets\/(?:[\w-]+\/)*[\w.-]+\.png$/,
    'must be a PNG path like /assets/scenes/berlin_1887.png',
  );
export const percent = z.number().min(0).max(100);
const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);
export const count = z.number().int().min(0);

export const ThemeSchema = z.enum(THEMES);
export const RegionIdSchema = z.enum(REGION_IDS);

export const MaterialsSchema = z.strictObject({
  bamboo: count.optional(),
  stone: count.optional(),
  tools: count.optional(),
});

export const PlaceSchema = z.strictObject({
  /** Short name for pins, cards and lists, e.g. "Berlin". */
  label: text.max(16, 'must be 16 characters or fewer'),
  then: text,
  today: text,
  lat: latitude,
  lon: longitude,
});

export const AnchorSchema = z.strictObject({ x: percent, y: percent });

export const SourceRefSchema = z.strictObject({
  sourceId: text,
  pages: z.string().optional(),
  chapter: z.string().optional(),
});

export const stopBase = {
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lowercase-with-dashes'),
  order: z.number().int().min(1),
  region: RegionIdSchema,
  dateLabel: text,
  year: z.number().int().min(1861).max(1896),
  place: PlaceSchema,
  theme: ThemeSchema,
  title: text.max(32, 'must be 32 characters or fewer'),
  teaser: text.max(60, 'must be 60 characters or fewer'),
  readMore: z.string().optional(),
  builder: z.boolean().optional(),
  sources: z.array(SourceRefSchema),
  verifyNotes: z.array(text).optional(),
};

// --- Stops: content v3 (SRS v2.3 §6.2b) --------------------------------------

export const MoodSchema = z.enum(MOODS);
export const SkillSchema = z.enum(SKILLS);

export const LineSchema = z.strictObject({
  speaker: text,
  text,
  mood: MoodSchema,
  onScene: z.boolean(),
  /** Present only when the words are quoted from a published source. */
  recorded: z.strictObject({ sourceId: text }).optional(),
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

export const QuestionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    ...questionBase,
    type: z.literal('mcq'),
    options: z.array(choice).length(4, 'needs exactly 4 options'),
    answer: text,
  }),
  z.strictObject({
    ...questionBase,
    type: z.literal('multi'),
    options: z.array(choice).min(3, 'needs at least 3 options'),
    answers: z.array(text).min(2, 'needs at least 2 answers'),
  }),
  z.strictObject({
    ...questionBase,
    type: z.literal('order'),
    /** Listed in the correct order; the game shuffles them. */
    items: z.array(choice).min(3, 'needs 3 to 5 items').max(5, 'needs 3 to 5 items'),
    answer: z.array(text),
  }),
  z.strictObject({
    ...questionBase,
    type: z.literal('match'),
    left: z.array(choice),
    right: z.array(choice),
    pairs: z.record(z.string(), text),
  }),
  z.strictObject({
    ...questionBase,
    type: z.literal('error'),
    segments: z.array(choice).min(2, 'needs at least 2 segments'),
    answer: text,
    correction: text,
  }),
]);

const v3Fields = {
  contentVersion: z.literal(3),
  /** Narration words, computed by the content script. */
  wordCount: count,
  /** Kept for the v2 "Dramatized" rule. */
  dialogue: z.strictObject({ dramatized: z.literal(true) }),
  chapters: z.array(ChapterSchema),
  quiz: z.array(QuestionSchema),
};

/** A stop that is written and illustrated ('draft' or 'verified'). */
export const PlayableStopSchema = z.strictObject({
  ...stopBase,
  ...v3Fields,
  status: z.enum(['draft', 'verified']),
  /** The 100–150-word summary shown by Read more. */
  story: text,
  scene: z.strictObject({
    image: assetPath,
    time: text,
    alt: text,
    /** FR-55: three short "what you see" notes for the scene gallery. */
    notes: z.array(text).max(3, 'use at most 3 notes').optional(),
    speakerAnchors: z.record(z.string(), AnchorSchema).optional(),
  }),
  rewards: z.strictObject({
    stamp: z.strictObject({ icon: assetPath }),
    item: text.optional(),
    materials: MaterialsSchema.optional(),
  }),
});

/** A placeholder stop: may have '[TO WRITE]' text and no art yet (SRS §6.2). */
export const OutlineStopSchema = z.strictObject({
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
  rewards: z.strictObject({
    stamp: z.strictObject({ icon: assetPath.nullable() }),
    item: text.optional(),
    materials: MaterialsSchema.optional(),
  }),
});

export const StopSchema = z.discriminatedUnion('status', [PlayableStopSchema, OutlineStopSchema]);
export const StopsFileSchema = z.array(StopSchema);

const boundsShape = {
  image: assetPath,
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  lat0: latitude,
  lat1: latitude,
  lon0: longitude,
  lon1: longitude,
};

export const RegionSchema = z.strictObject({
  id: RegionIdSchema,
  label: text,
  years: text,
  ...boundsShape,
  inset: z.strictObject({ id: text, label: text, ...boundsShape }).optional(),
  route: z.array(z.tuple([latitude, longitude])).optional(),
});
export const RegionsFileSchema = z.array(RegionSchema);

const PortraitCropSchema = z.strictObject({
  left: z.number(),
  top: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const CharacterSchema = z
  .strictObject({
    name: text,
    sprite: assetPath.optional(),
    icon: assetPath.optional(),
    /** Which part of the sprite the v2.2 dialogue box shows (optional). */
    spriteCrop: PortraitCropSchema.optional(),
    /** v2.3 §7.10: the close-up portrait sheet; null for the narrator. */
    portrait: assetPath.nullable().optional(),
    /** v2.3 §6.2b: speaks only from off the scene (letters, memories), so has no sprite. */
    offscreenOnly: z.literal(true).optional(),
  })
  .refine((c) => c.sprite !== undefined || c.icon !== undefined || c.offscreenOnly, {
    message: 'needs a sprite or an icon (or offscreenOnly: true)',
  });
export const CharactersFileSchema = z.record(z.string(), CharacterSchema);

export const ItemSchema = z.strictObject({ name: text, desc: text, icon: assetPath });
export const ItemsFileSchema = z.record(z.string(), ItemSchema);

const BuilderProjectSchema = z.strictObject({
  prebuilt: z.boolean(),
  cost: MaterialsSchema,
  fact: text,
});

export const BuilderFileSchema = z.strictObject({
  start: z.strictObject({ bamboo: count, stone: count, tools: count }),
  projects: z.strictObject({
    school: BuilderProjectSchema,
    clinic: BuilderProjectSchema,
    water: BuilderProjectSchema,
  }),
  note: z.string().optional(),
});

export const SourceSchema = z.strictObject({
  id: text,
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  kind: z.enum(['print', 'online', 'art-reference']),
  /** v2.3 §3.6: the short title shown on Recorded tags, facts and quiz answers. */
  short: text.max(70, 'must be 70 characters or fewer'),
  citation: text,
  useFor: text,
  where: text,
  urls: z.array(z.url()),
  alsoUsedAs: z.array(z.string()).optional(),
  chapters: z.string().optional(),
});
export const SourcesFileSchema = z.array(SourceSchema);

export type Theme = z.infer<typeof ThemeSchema>;
export type RegionId = z.infer<typeof RegionIdSchema>;
export type Material = (typeof MATERIALS)[number];
export type BuilderProject = (typeof BUILDER_PROJECTS)[number];
export type PlayableStop = z.infer<typeof PlayableStopSchema>;
export type OutlineStop = z.infer<typeof OutlineStopSchema>;
export type Stop = z.infer<typeof StopSchema>;
export type Mood = z.infer<typeof MoodSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Line = z.infer<typeof LineSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionType = Question['type'];
export type Region = z.infer<typeof RegionSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Builder = z.infer<typeof BuilderFileSchema>;
export type Source = z.infer<typeof SourceSchema>;

/** Everything in public/content/, after validation. */
export interface Content {
  stops: Stop[];
  regions: Region[];
  characters: Record<string, Character>;
  items: Record<string, Item>;
  builder: Builder;
  sources: Source[];
}

export const FILE_SCHEMAS = {
  stops: StopsFileSchema,
  regions: RegionsFileSchema,
  characters: CharactersFileSchema,
  items: ItemsFileSchema,
  builder: BuilderFileSchema,
  sources: SourcesFileSchema,
} as const satisfies Record<ContentFileName, z.ZodType>;
