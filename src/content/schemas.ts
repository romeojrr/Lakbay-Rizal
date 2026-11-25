// Zod schemas for public/content/*.json — mirrors SRS §6.2.
// Objects are strict so a misspelled key fails validation instead of being ignored.
import { z } from 'zod';
import {
  BUILDER_PROJECTS,
  CONTENT_FILES,
  MATERIALS,
  REGION_IDS,
  THEMES,
  type ContentFileName,
} from './constants';

export { BUILDER_PROJECTS, CONTENT_FILES, MATERIALS, REGION_IDS, THEMES, type ContentFileName };

const text = z.string().trim().min(1, 'must not be empty');
// Folder names have no dots, so a path cannot climb out of /assets/ with "..".
const assetPath = z
  .string()
  .regex(
    /^\/assets\/(?:[\w-]+\/)*[\w.-]+\.png$/,
    'must be a PNG path like /assets/scenes/berlin_1887.png',
  );
const percent = z.number().min(0).max(100);
const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);
const count = z.number().int().min(0);

export const ThemeSchema = z.enum(THEMES);
export const RegionIdSchema = z.enum(REGION_IDS);

const MaterialsSchema = z.strictObject({
  bamboo: count.optional(),
  stone: count.optional(),
  tools: count.optional(),
});

const PlaceSchema = z.strictObject({
  /** Short name for pins, cards and lists, e.g. "Berlin". */
  label: text.max(16, 'must be 16 characters or fewer'),
  then: text,
  today: text,
  lat: latitude,
  lon: longitude,
});

const AnchorSchema = z.strictObject({ x: percent, y: percent });

const DialogueSchema = z.strictObject({
  dramatized: z.boolean(),
  lines: z.array(z.strictObject({ speaker: text, text })),
});

const QuizQuestionSchema = z.strictObject({
  id: text,
  prompt: text,
  options: z.array(z.strictObject({ id: text, text })).length(4, 'needs exactly 4 options'),
  answer: text,
  hint: text,
});

const SourceRefSchema = z.strictObject({
  sourceId: text,
  pages: z.string().optional(),
  chapter: z.string().optional(),
});

const stopBase = {
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

/** A stop that is written and illustrated ('draft' or 'verified'). */
export const PlayableStopSchema = z.strictObject({
  ...stopBase,
  status: z.enum(['draft', 'verified']),
  story: text,
  scene: z.strictObject({
    image: assetPath,
    time: text,
    alt: text,
    /** FR-55: three short "what you see" notes for the scene gallery. */
    notes: z.array(text).max(3, 'use at most 3 notes').optional(),
    speakerAnchors: z.record(z.string(), AnchorSchema).optional(),
  }),
  dialogue: DialogueSchema.extend({
    lines: DialogueSchema.shape.lines.min(1, 'needs at least 1 line'),
  }),
  quiz: z.array(QuizQuestionSchema),
  rewards: z.strictObject({
    stamp: z.strictObject({ icon: assetPath }),
    item: text.optional(),
    materials: MaterialsSchema.optional(),
  }),
});

/** A placeholder stop: may have '[TO WRITE]' text and no art yet (SRS §6.2). */
export const OutlineStopSchema = z.strictObject({
  ...stopBase,
  status: z.literal('outline'),
  story: z.string(),
  scene: z.strictObject({
    image: assetPath.nullable(),
    time: z.string().nullable(),
    alt: z.string(),
    notes: z.array(z.string()).optional(),
    speakerAnchors: z.record(z.string(), AnchorSchema).optional(),
  }),
  dialogue: DialogueSchema,
  quiz: z.array(QuizQuestionSchema),
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
    portrait: PortraitCropSchema.optional(),
  })
  .refine((c) => c.sprite !== undefined || c.icon !== undefined, {
    message: 'needs a sprite or an icon',
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
