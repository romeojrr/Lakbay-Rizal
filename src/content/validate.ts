// Validates public/content/*.json: Zod schemas first, then the cross-file rules in SRS §6.2.
// Used by scripts/validate-content.ts (build + test) and by the loader in development.
import type { z } from 'zod';
import { isInsideMap, projectToPercent } from '../lib/projection';
import {
  CONTENT_FILES,
  FILE_SCHEMAS,
  REGION_IDS,
  type Content,
  type ContentFileName,
  type Stop,
} from './schemas';

export type RawContent = Record<ContentFileName, unknown>;

export interface Problem {
  file: string;
  where: string;
  message: string;
}

export interface AssetInfo {
  width: number;
  height: number;
}

export interface ValidateOptions {
  /**
   * Returns a PNG's size, or null when the file does not exist.
   * Leave it out to skip asset checks (the browser cannot see the file system).
   */
  assetInfo?: (path: string) => AssetInfo | null;
}

export interface ValidationResult {
  content: Content | null;
  errors: Problem[];
  warnings: Problem[];
}

const SIZES = {
  scene: { w: 384, h: 216 },
  icon: { w: 26, h: 26 },
} as const;

// SRS §14.1: never cite these.
const BANNED_SOURCE_HOSTS =
  /(^|\.)(scribd\.com|slideshare\.net|prezi\.com|coursehero\.com|brainly\.[a-z.]+|wikipedia\.org)$/i;

export function formatProblem(problem: Problem): string {
  return `${problem.file} › ${problem.where}: ${problem.message}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateContent(raw: RawContent, options: ValidateOptions = {}): ValidationResult {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const parsed: Partial<Record<ContentFileName, unknown>> = {};

  for (const name of CONTENT_FILES) {
    const result = FILE_SCHEMAS[name].safeParse(raw[name]);
    if (result.success) {
      parsed[name] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          file: `${name}.json`,
          where: describePath(raw[name], issue.path),
          message: issueMessage(issue),
        });
      }
    }
  }
  if (errors.length > 0) return { content: null, errors, warnings };

  const content = parsed as Content;
  new CrossChecker(content, options, errors, warnings).run();
  return { content: errors.length > 0 ? null : content, errors, warnings };
}

/** Turns a Zod path like [10, 'quiz', 0, 'answer'] into "berlin-1887 › quiz[0].answer". */
function describePath(fileValue: unknown, path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(whole file)';
  const [first, ...rest] = path;
  let label: string;
  if (typeof first === 'number' && Array.isArray(fileValue)) {
    const element: unknown = fileValue[first];
    const id = element && typeof element === 'object' && 'id' in element ? element.id : undefined;
    label = typeof id === 'string' && id ? id : `entry #${first + 1}`;
  } else {
    label = String(first);
  }
  const field = rest
    .map((part, i) =>
      typeof part === 'number' ? `[${part}]` : `${i === 0 ? '' : '.'}${String(part)}`,
    )
    .join('');
  return field ? `${label} › ${field}` : label;
}

function issueMessage(issue: z.core.$ZodIssue): string {
  if (issue.code === 'invalid_union' && 'discriminator' in issue && issue.discriminator) {
    return `${issue.discriminator} must be "outline", "draft" or "verified"`;
  }
  return issue.message;
}

class CrossChecker {
  private readonly stopsByOrder: Stop[];

  constructor(
    private readonly content: Content,
    private readonly options: ValidateOptions,
    private readonly errors: Problem[],
    private readonly warnings: Problem[],
  ) {
    this.stopsByOrder = [...content.stops].sort((a, b) => a.order - b.order);
  }

  run(): void {
    this.checkStopIdsAndOrder();
    this.checkRegions();
    this.checkSources();
    for (const stop of this.stopsByOrder) this.checkStop(stop);
    if (this.options.assetInfo) this.checkAssets(this.options.assetInfo);
  }

  private error(file: string, where: string, message: string): void {
    this.errors.push({ file, where, message });
  }

  private warn(file: string, where: string, message: string): void {
    this.warnings.push({ file, where, message });
  }

  private checkStopIdsAndOrder(): void {
    const { stops } = this.content;
    for (const id of duplicates(stops.map((s) => s.id))) {
      this.error('stops.json', id, 'this id is used by more than one stop');
    }
    for (const order of duplicates(stops.map((s) => s.order))) {
      this.error('stops.json', `order ${order}`, 'this order is used by more than one stop');
    }
    const orders = new Set(stops.map((s) => s.order));
    for (let n = 1; n <= stops.length; n++) {
      if (!orders.has(n)) {
        this.error(
          'stops.json',
          'order',
          `orders must run 1 to ${stops.length} with no gaps; ${n} is missing`,
        );
      }
    }
    const builderStops = stops.filter((s) => s.builder);
    if (builderStops.length > 1) {
      this.error(
        'stops.json',
        builderStops.map((s) => s.id).join(', '),
        'only one stop may open the builder',
      );
    }
  }

  private checkRegions(): void {
    const { regions } = this.content;
    for (const id of duplicates(regions.map((r) => r.id))) {
      this.error('regions.json', id, 'this region is listed more than once');
    }
    for (const id of REGION_IDS) {
      if (!regions.some((r) => r.id === id))
        this.error('regions.json', id, 'this region is missing');
    }
    for (const region of regions) {
      const boxes = region.inset ? [region, region.inset] : [region];
      for (const box of boxes) {
        const where = box === region ? region.id : `${region.id} › inset`;
        if (box.lat0 >= box.lat1) this.error('regions.json', where, 'lat0 must be less than lat1');
        if (box.lon0 >= box.lon1) this.error('regions.json', where, 'lon0 must be less than lon1');
      }
    }
  }

  private checkSources(): void {
    const { sources } = this.content;
    for (const id of duplicates(sources.map((s) => s.id))) {
      this.error('sources.json', id, 'this id is used more than once');
    }
    for (const source of sources) {
      source.urls.forEach((url, i) => {
        const host = new URL(url).hostname;
        if (BANNED_SOURCE_HOSTS.test(host)) {
          this.error(
            'sources.json',
            `${source.id} › urls[${i}]`,
            `${host} may not be cited (SRS §14.1)`,
          );
        }
      });
    }
  }

  private checkStop(stop: Stop): void {
    const { characters, items, regions, sources } = this.content;
    const at = (field?: string) => (field ? `${stop.id} › ${field}` : stop.id);
    const error = (field: string, message: string) => this.error('stops.json', at(field), message);
    const warn = (field: string, message: string) => this.warn('stops.json', at(field), message);

    const region = regions.find((r) => r.id === stop.region);
    if (region && !isInsideMap(projectToPercent(stop.place.lat, stop.place.lon, region))) {
      error('place', `lat/lon fall outside the ${region.label} map`);
    }

    stop.sources.forEach((ref, i) => {
      if (!sources.some((s) => s.id === ref.sourceId)) {
        error(`sources[${i}].sourceId`, `"${ref.sourceId}" is not in sources.json`);
      }
    });

    const item = stop.rewards.item;
    if (item !== undefined && !(item in items)) {
      error('rewards.item', `"${item}" is not in items.json`);
    }

    if (stop.status === 'outline') return;

    // Dialogue: every speaker except the narrator needs a character and a scene anchor.
    const { lines, dramatized } = stop.dialogue;
    lines.forEach((line, i) => {
      if (line.speaker === 'narrator') return;
      if (!(line.speaker in characters)) {
        error(`dialogue.lines[${i}].speaker`, `"${line.speaker}" is not in characters.json`);
      }
      if (!stop.scene.speakerAnchors?.[line.speaker]) {
        error(
          `dialogue.lines[${i}].speaker`,
          `"${line.speaker}" has no entry in scene.speakerAnchors`,
        );
      }
    });
    if (lines.length > 5)
      warn('dialogue.lines', `has ${lines.length} lines; use 5 or fewer (SRS §6.4)`);
    lines.forEach((line, i) => {
      const words = countWords(line.text);
      if (words > 25)
        warn(`dialogue.lines[${i}].text`, `has ${words} words; use 25 or fewer (SRS §6.4)`);
    });
    if (!dramatized && lines.some((l) => l.speaker !== 'narrator')) {
      warn(
        'dialogue.dramatized',
        'a character speaks but the dialogue is not marked dramatized; set it to true unless every spoken line is a documented quote',
      );
    }

    // Quiz: the final stop has none (GD-6); every other stop has 1–5.
    const isFinal = stop === this.stopsByOrder.at(-1);
    if (isFinal && stop.quiz.length > 0) {
      error('quiz', 'the final stop must have no quiz (SRS GD-6)');
    } else if (!isFinal && (stop.quiz.length < 1 || stop.quiz.length > 5)) {
      error('quiz', `needs 1 to 5 questions, has ${stop.quiz.length}`);
    }
    for (const id of duplicates(stop.quiz.map((q) => q.id))) {
      error('quiz', `question id "${id}" is used more than once`);
    }
    stop.quiz.forEach((question, qi) => {
      const optionIds = question.options.map((o) => o.id);
      for (const id of duplicates(optionIds)) {
        error(`quiz[${qi}].options`, `option id "${id}" is used more than once`);
      }
      if (!optionIds.includes(question.answer)) {
        error(
          `quiz[${qi}].answer`,
          `"${question.answer}" does not match any option id (${optionIds.join(', ')})`,
        );
      }
    });

    // Story length: aim for 100–150 words.
    const words = countWords(stop.story);
    if (words < 90 || words > 170) {
      const message = `has ${words} words; it should be 100–150`;
      if (stop.status === 'verified') error('story', message);
      else warn('story', message);
    }

    if (stop.status === 'verified') this.checkVerified(stop, error);
  }

  private checkVerified(stop: Stop, error: (field: string, message: string) => void): void {
    const refs = stop.sources.map((ref) => ({
      ref,
      source: this.content.sources.find((s) => s.id === ref.sourceId),
    }));
    if (refs.length < 2) error('sources', 'a verified stop needs at least 2 sources');
    if (!refs.some(({ source }) => source && source.tier <= 2)) {
      error('sources', 'a verified stop needs at least one Tier 1 or Tier 2 source');
    }
    refs.forEach(({ ref, source }, i) => {
      if (source?.kind === 'print' && !ref.pages?.trim()) {
        error(`sources[${i}].pages`, `"${ref.sourceId}" is a book; add page numbers`);
      }
    });
    if (stop.verifyNotes && stop.verifyNotes.length > 0) {
      error('verifyNotes', 'a verified stop must have no verifyNotes left');
    }
  }

  private checkAssets(assetInfo: NonNullable<ValidateOptions['assetInfo']>): void {
    const check = (
      file: string,
      where: string,
      path: string | null,
      size?: { w: number; h: number },
    ) => {
      if (path === null) return;
      const info = assetInfo(path);
      if (!info) {
        this.error(file, where, `${path} does not exist in assets/`);
      } else if (size && (info.width !== size.w || info.height !== size.h)) {
        this.error(
          file,
          where,
          `${path} is ${info.width} × ${info.height}; expected ${size.w} × ${size.h}`,
        );
      }
    };

    for (const stop of this.content.stops) {
      check('stops.json', `${stop.id} › scene.image`, stop.scene.image, SIZES.scene);
      check('stops.json', `${stop.id} › rewards.stamp.icon`, stop.rewards.stamp.icon, SIZES.icon);
    }
    for (const [id, item] of Object.entries(this.content.items)) {
      if (!item.icon.startsWith('/assets/icons/items/')) {
        this.error('items.json', `${id} › icon`, 'item icons must be in /assets/icons/items/');
      }
      check('items.json', `${id} › icon`, item.icon, SIZES.icon);
    }
    for (const [id, character] of Object.entries(this.content.characters)) {
      check('characters.json', `${id} › sprite`, character.sprite ?? null);
      check('characters.json', `${id} › icon`, character.icon ?? null);
    }
    for (const region of this.content.regions) {
      check('regions.json', `${region.id} › image`, region.image, { w: region.w, h: region.h });
      if (region.inset) {
        check('regions.json', `${region.id} › inset.image`, region.inset.image, {
          w: region.inset.w,
          h: region.inset.h,
        });
      }
    }
  }
}

function duplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const repeated = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}
