// Test helpers that use the real files in public/content/.
import builder from '../../public/content/builder.json';
import characters from '../../public/content/characters.json';
import items from '../../public/content/items.json';
import regions from '../../public/content/regions.json';
import sources from '../../public/content/sources.json';
import stops from '../../public/content/stops.json';
import gamification from '../../public/content/gamification.json';
import guide from '../../public/content/guide.json';
import filGamification from '../../public/content/i18n/fil.gamification.json';
import filGuide from '../../public/content/i18n/fil.guide.json';
import filStops from '../../public/content/i18n/fil.stops.json';
import stopsV3 from '../../public/content/stops.v3.json';
import type { RootData } from '../app/routes';
import type { Content, Stop } from '../content/schemas';
import {
  StopsV3FileSchema,
  type ContentV3,
  type FilContent,
  type StopV3,
} from '../content/schemas.v3';
import { formatProblem, validateContent, type RawContent } from '../content/validate';
import { validateContentV3, type RawV3Content } from '../content/validate.v3';

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

const RAW_V3 = {
  'stops.v3': stopsV3,
  guide,
  gamification,
  'i18n/fil.stops': filStops,
  'i18n/fil.guide': filGuide,
  'i18n/fil.gamification': filGamification,
};

/** A fresh, mutable deep copy of content v3 and the Filipino files (SRS v2.3 §6.2b). */
export function rawContentV3(): RawV3Content {
  return JSON.parse(JSON.stringify(RAW_V3)) as RawV3Content;
}

/** Content v3 and the Filipino files, validated and typed. */
export function realContentV3(): ContentV3 & FilContent {
  const result = validateContentV3(rawContentV3(), realContent());
  if (!result.content) throw new Error(result.errors.map(formatProblem).join('\n'));
  return result.content;
}

/** The real v3 stories (stops.v3.json), schema-checked. */
export function realStories(): StopV3[] {
  return StopsV3FileSchema.parse(JSON.parse(JSON.stringify(stopsV3)));
}

/** What the root loader returns, from the real files. `stops` defaults to every stop. */
export function rootData(content: Content = realContent(), stops?: Stop[]): RootData {
  return { content, stops: stops ?? content.stops, stories: realStories() };
}
