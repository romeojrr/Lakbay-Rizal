// Test helpers that use the real files in public/content/.
import builder from '../../public/content/builder.json';
import characters from '../../public/content/characters.json';
import items from '../../public/content/items.json';
import regions from '../../public/content/regions.json';
import sources from '../../public/content/sources.json';
import stops from '../../public/content/stops.json';
import type { Content } from '../content/schemas';
import { formatProblem, validateContent, type RawContent } from '../content/validate';

const RAW = { stops, regions, characters, items, builder, sources };

/** A fresh, mutable deep copy of the raw JSON, for breaking fields in tests. */
export function rawContent(): RawContent {
  return JSON.parse(JSON.stringify(RAW)) as RawContent;
}

/** The real content, validated and typed. */
export function realContent(): Content {
  const result = validateContent(rawContent());
  if (!result.content) throw new Error(result.errors.map(formatProblem).join('\n'));
  return result.content;
}
