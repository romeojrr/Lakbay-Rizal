// Validates guide.json, gamification.json and the Filipino files (SRS v2.3 §3.7, §3.8,
// §3.10, §6.2b mirror check) and the portrait sheets (§7.10): Zod schemas first, then the
// cross-file rules. Run after the main files have passed (it needs their stops and names).
import type { z } from 'zod';
import {
  BUILDER_PROJECTS,
  FIL_CONTENT_FILES,
  GUIDE_TIPS,
  PORTRAIT_SHEET,
  REACTION_KINDS,
  V3_CONTENT_FILES,
  type FilContentFileName,
  type V3ContentFileName,
} from './constants';
import type { Content } from './schemas';
import {
  FIL_FILE_SCHEMAS,
  V3_FILE_SCHEMAS,
  type ContentV3,
  type FilContent,
  type FilStop,
  type Question,
  type StopV3,
} from './schemas.v3';
import { countWords, duplicates, type AssetInfo, type Problem } from './validate';

export type RawV3Content = Record<V3ContentFileName | FilContentFileName, unknown>;

export interface V3ValidationResult {
  content: (ContentV3 & FilContent) | null;
  errors: Problem[];
  warnings: Problem[];
}

export interface V3ValidateOptions {
  /** Returns a PNG's size, or null when it does not exist. Leave out to skip file checks. */
  assetInfo?: (path: string) => AssetInfo | null;
}

const MAX_GUIDE_WORDS = 32;

export function validateContentV3(
  raw: RawV3Content,
  base: Content,
  options: V3ValidateOptions = {},
): V3ValidationResult {
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const parsed: Partial<Record<keyof RawV3Content, unknown>> = {};
  const schemas: Record<keyof RawV3Content, z.ZodType> = {
    ...V3_FILE_SCHEMAS,
    ...FIL_FILE_SCHEMAS,
  };

  for (const name of [...V3_CONTENT_FILES, ...FIL_CONTENT_FILES]) {
    const result = schemas[name].safeParse(raw[name]);
    if (result.success) {
      parsed[name] = result.data;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          file: `${name}.json`,
          where: describePath(raw[name], issue.path),
          message: issue.message,
        });
      }
    }
  }
  if (errors.length > 0) return { content: null, errors, warnings };

  const content = parsed as ContentV3 & FilContent;
  new V3Checker(content, base, options, errors, warnings).run();
  return { content: errors.length > 0 ? null : content, errors, warnings };
}

/** "berlin-1887 › chapters[0].title" for the stops list, "tour[1].target" for other files. */
function describePath(fileValue: unknown, path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(whole file)';
  const join = (parts: readonly PropertyKey[]) =>
    parts
      .map((part, i) =>
        typeof part === 'number' ? `[${part}]` : `${i === 0 ? '' : '.'}${String(part)}`,
      )
      .join('');
  const [first, ...rest] = path;
  if (typeof first !== 'number' || !Array.isArray(fileValue)) return join(path);
  const element: unknown = fileValue[first];
  const id = element && typeof element === 'object' && 'id' in element ? element.id : undefined;
  const label = typeof id === 'string' && id ? id : `entry #${first + 1}`;
  return rest.length > 0 ? `${label} › ${join(rest)}` : label;
}

const FIL_STOPS = 'i18n/fil.stops.json';

class V3Checker {
  private readonly stops: StopV3[];

  constructor(
    private readonly content: ContentV3 & FilContent,
    private readonly base: Content,
    private readonly options: V3ValidateOptions,
    private readonly errors: Problem[],
    private readonly warnings: Problem[],
  ) {
    this.stops = [...base.stops].sort((a, b) => a.order - b.order);
  }

  run(): void {
    this.checkGuide();
    this.checkGamification();
    this.checkFilStops();
    this.checkFilGuide();
    this.checkFilGamification();
    if (this.options.assetInfo) this.checkPortraits(this.options.assetInfo);
  }

  private error(file: string, where: string, message: string): void {
    this.errors.push({ file, where, message });
  }

  private warn(file: string, where: string, message: string): void {
    this.warnings.push({ file, where, message });
  }

  // --- guide.json --------------------------------------------------------------

  private checkGuide(): void {
    const { guide } = this.content;
    const file = 'guide.json';
    const speaker = this.base.characters[guide.speaker];
    if (!speaker) this.error(file, 'speaker', `"${guide.speaker}" is not in characters.json`);
    else if (!speaker.portrait) this.error(file, 'speaker', `"${guide.speaker}" has no portrait`);

    for (const id of duplicates(guide.tour.map((s) => s.id))) {
      this.error(file, `tour › ${id}`, 'this step id is used more than once');
    }
    const stopIds = new Set(this.stops.map((s) => s.id));
    guide.tour.forEach((step, i) => {
      const where = `tour[${i}] (${step.id})`;
      const route = /^\/stop\/([^/]+)/.exec(step.route);
      if (route?.[1] && !stopIds.has(route[1])) {
        this.error(file, `${where}.route`, `"${route[1]}" is not a stop id`);
      }
      if (step.next === 'click-target' && step.target === null) {
        this.error(file, `${where}.next`, '"click-target" needs a target to click');
      }
      const words = countWords(step.text);
      if (words > MAX_GUIDE_WORDS) {
        this.warn(file, `${where}.text`, `has ${words} words; use ${MAX_GUIDE_WORDS} or fewer`);
      }
    });
    for (const tip of GUIDE_TIPS) {
      if (!guide.tips[tip]) this.error(file, `tips › ${tip}`, 'this tip is missing (SRS §3.7)');
    }
    if (guide.reactions.streak.length !== 2) {
      this.warn(file, 'reactions.streak', 'should have 2 lines: one for a streak of 5, one for 10');
    }
  }

  // --- gamification.json -------------------------------------------------------

  private checkGamification(): void {
    const { gamification } = this.content;
    const file = 'gamification.json';
    const { ranks, achievements, quizPass } = gamification;
    for (const id of duplicates(ranks.map((r) => r.id))) {
      this.error(file, `ranks › ${id}`, 'this rank id is used more than once');
    }
    if (ranks[0] && ranks[0].minXp !== 0) {
      this.error(file, 'ranks[0].minXp', 'the first rank must start at 0 XP');
    }
    ranks.forEach((rank, i) => {
      const previous = ranks[i - 1];
      if (previous && rank.minXp <= previous.minXp) {
        this.error(file, `ranks[${i}].minXp`, 'ranks must be listed from the lowest XP up');
      }
    });
    if (quizPass.minCorrectFirstTry > quizPass.outOf) {
      this.error(file, 'quizPass', 'minCorrectFirstTry cannot be more than outOf');
    }
    for (const id of duplicates(achievements.map((a) => a.id))) {
      this.error(file, `achievements › ${id}`, 'this achievement id is used more than once');
    }
    achievements.forEach((achievement, i) => {
      if (achievement.icon !== null && !(achievement.icon in this.base.items)) {
        this.error(
          file,
          `achievements[${i}] (${achievement.id}).icon`,
          `"${achievement.icon}" is not an item in items.json`,
        );
      }
    });
  }

  // --- Filipino files (§3.10, §6.2b mirror check) -------------------------------

  private checkFilStops(): void {
    const fil = this.content['i18n/fil.stops'];
    const ids = new Set(this.stops.map((s) => s.id));
    for (const stop of this.stops) {
      const translated = fil.stops[stop.id];
      if (!translated) this.error(FIL_STOPS, stop.id, 'this stop is missing');
      else this.mirrorStop(stop, translated);
    }
    for (const id of Object.keys(fil.stops)) {
      if (!ids.has(id)) this.error(FIL_STOPS, id, 'is not a stop in stops.json');
    }
    const known: [string, Record<string, unknown> | undefined, Set<string>][] = [
      ['items', fil.items, new Set(Object.keys(this.base.items))],
      ['characters', fil.characters, new Set(Object.keys(this.base.characters))],
      ['builder', fil.builder, new Set(BUILDER_PROJECTS)],
      ['regions', fil.regions, new Set(this.base.regions.map((r) => r.id))],
    ];
    for (const [section, entries, allowed] of known) {
      for (const id of Object.keys(entries ?? {})) {
        if (!allowed.has(id))
          this.error(
            FIL_STOPS,
            `${section} › ${id}`,
            `is not in ${section === 'builder' ? 'builder.json' : `${section}.json`}`,
          );
      }
    }
  }

  private mirrorStop(stop: StopV3, fil: FilStop): void {
    const at = (field: string) => `${stop.id} › ${field}`;
    const mismatch = (field: string, what: string, en: number, filCount: number) =>
      this.error(FIL_STOPS, at(field), `has ${filCount} ${what}; stops.json has ${en}`);

    if (fil.chapters) {
      if (fil.chapters.length !== stop.chapters.length) {
        mismatch('chapters', 'chapters', stop.chapters.length, fil.chapters.length);
      }
      fil.chapters.forEach((chapter, ci) => {
        const en = stop.chapters[ci];
        if (!en) return;
        const ch = `chapters[${ci}]`;
        if (chapter.narration && chapter.narration.length !== en.narration.length) {
          mismatch(`${ch}.narration`, 'paragraphs', en.narration.length, chapter.narration.length);
        }
        if (chapter.lines && chapter.lines.length !== en.lines.length) {
          mismatch(`${ch}.lines`, 'lines', en.lines.length, chapter.lines.length);
        }
        if (chapter.fact !== undefined && !en.fact) {
          this.error(FIL_STOPS, at(`${ch}.fact`), 'has a fact, but the English chapter has none');
        }
        if (chapter.fact === undefined && en.fact) {
          this.error(FIL_STOPS, at(`${ch}.fact`), 'is missing; the English chapter has a fact');
        }
      });
    }

    if (fil.quiz) {
      if (fil.quiz.length !== stop.quiz.length) {
        mismatch('quiz', 'questions', stop.quiz.length, fil.quiz.length);
      }
      fil.quiz.forEach((question, qi) => {
        const en = stop.quiz[qi];
        if (!en) return;
        const q = `quiz[${qi}]`;
        const expected = choiceCounts(en);
        for (const field of ['options', 'items', 'left', 'right', 'segments'] as const) {
          const list = question[field];
          const want = expected[field];
          if (list === undefined) continue;
          if (want === undefined) {
            this.error(FIL_STOPS, at(`${q}.${field}`), `a "${en.type}" question has no ${field}`);
          } else if (list.length !== want) {
            mismatch(`${q}.${field}`, field, want, list.length);
          }
        }
        if (question.correction !== undefined && en.type !== 'error') {
          this.error(FIL_STOPS, at(`${q}.correction`), `a "${en.type}" question has no correction`);
        }
      });
    }
  }

  private checkFilGuide(): void {
    const fil = this.content['i18n/fil.guide'];
    const { guide } = this.content;
    const file = 'i18n/fil.guide.json';
    const stepIds = new Set(guide.tour.map((s) => s.id));
    for (const id of Object.keys(fil.tour ?? {})) {
      if (!stepIds.has(id)) this.error(file, `tour › ${id}`, 'is not a step in guide.json');
    }
    for (const id of Object.keys(fil.tips ?? {})) {
      if (!(id in guide.tips)) this.error(file, `tips › ${id}`, 'is not a tip in guide.json');
    }
    for (const [kind, lines] of Object.entries(fil.reactions ?? {})) {
      const en = (REACTION_KINDS as readonly string[]).includes(kind)
        ? guide.reactions[kind as (typeof REACTION_KINDS)[number]]
        : undefined;
      if (!en) this.error(file, `reactions › ${kind}`, 'is not a reaction kind in guide.json');
      else if (lines.length !== en.length) {
        this.error(
          file,
          `reactions › ${kind}`,
          `has ${lines.length} lines; guide.json has ${en.length}`,
        );
      }
    }
  }

  private checkFilGamification(): void {
    const fil = this.content['i18n/fil.gamification'];
    const { gamification } = this.content;
    const file = 'i18n/fil.gamification.json';
    const achievementIds = new Set(gamification.achievements.map((a) => a.id));
    for (const id of Object.keys(fil.achievements ?? {})) {
      if (!achievementIds.has(id)) {
        this.error(file, `achievements › ${id}`, 'is not an achievement in gamification.json');
      }
    }
    const rankIds = new Set(gamification.ranks.map((r) => r.id));
    for (const id of Object.keys(fil.ranks ?? {})) {
      if (!rankIds.has(id)) this.error(file, `ranks › ${id}`, 'is not a rank in gamification.json');
    }
  }

  // --- Portrait files (§7.10) ---------------------------------------------------

  private checkPortraits(assetInfo: NonNullable<V3ValidateOptions['assetInfo']>): void {
    for (const [id, character] of Object.entries(this.base.characters)) {
      if (!character.portrait) continue;
      const where = `${id} › portrait`;
      const expected = `/assets/portraits/${id}.png`;
      if (character.portrait !== expected) {
        this.error('characters.json', where, `portraits live at ${expected} (SRS §7.10)`);
      }
      const info = assetInfo(character.portrait);
      if (!info) {
        this.error('characters.json', where, `${character.portrait} does not exist in assets/`);
      } else if (info.width !== PORTRAIT_SHEET.w || info.height !== PORTRAIT_SHEET.h) {
        this.error(
          'characters.json',
          where,
          `${character.portrait} is ${info.width} × ${info.height}; a portrait sheet is ${PORTRAIT_SHEET.w} × ${PORTRAIT_SHEET.h} (4 × 6 frames of 64 px)`,
        );
      }
    }
  }
}

/** The number of choices each list of a question has, for the Filipino mirror check. */
function choiceCounts(
  question: Question,
): Partial<Record<'options' | 'items' | 'left' | 'right' | 'segments', number>> {
  switch (question.type) {
    case 'mcq':
    case 'multi':
      return { options: question.options.length };
    case 'order':
      return { items: question.items.length };
    case 'match':
      return { left: question.left.length, right: question.right.length };
    case 'error':
      return { segments: question.segments.length };
  }
}
