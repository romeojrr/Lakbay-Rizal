// Plain constants shared by the schemas, loader and selectors.
// Kept free of Zod so the production bundle does not include it.

export const THEMES = ['study', 'travel', 'writing', 'cause', 'exile'] as const;
export const REGION_IDS = ['philippines', 'asia', 'europe', 'america'] as const;
export const MATERIALS = ['bamboo', 'stone', 'tools'] as const;
export const BUILDER_PROJECTS = ['school', 'clinic', 'water'] as const;

/** The files in public/content/, without the .json extension. */
export const CONTENT_FILES = [
  'stops',
  'regions',
  'characters',
  'items',
  'builder',
  'sources',
] as const;

export type ContentFileName = (typeof CONTENT_FILES)[number];
