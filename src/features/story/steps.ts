// SRS v2.3 §3.6: a stop's story, one step at a time:
// chapter title card → narration paragraphs → dialogue lines → "Did you know?" fact → next chapter.
// A long paragraph is shown as a few pages (split between sentences, the words unchanged), so
// each page fits the dialogue box at the normal reading size.
import type { ScenePlace } from '../../content/schemas';
import type { Chapter, StopV3 } from '../../content/schemas.v3';

/** A paragraph longer than this many characters is split into pages. */
export const PAGE_CHARS = 360;

/** Words before a full stop that do not end a sentence (English and Filipino). */
const ABBREVIATIONS = new Set([
  'Dr',
  'Mr',
  'Mrs',
  'Ms',
  'St',
  'Mt',
  'Fr',
  'Sr',
  'Jr',
  'No',
  'Gen',
  'Gov',
  'Prof',
  'Rev',
  'Gng',
  'Bb',
  'Sto',
  'Sta',
  'G',
]);

/** Where each sentence starts in `text` (0 first). */
function sentenceStarts(text: string): number[] {
  const starts = [0];
  // An end mark, any closing quotes or brackets, spaces, then the next sentence's first letter.
  const end = /([.!?])["'\u201d\u2019)\]]*\s+(?=["'\u201c\u2018(]?[\p{Lu}\d])/gu;
  for (const match of text.matchAll(end)) {
    const at = match.index ?? 0;
    const word = /(\p{L}+)$/u.exec(text.slice(0, at))?.[1] ?? '';
    if (match[1] === '.' && (ABBREVIATIONS.has(word) || /^\p{Lu}$/u.test(word))) continue;
    starts.push(at + match[0].length);
  }
  return starts;
}

/**
 * Splits a paragraph into pages of about equal length, between sentences. Short paragraphs
 * (and single long sentences) stay one page. The pages joined with a space give the text back.
 */
export function paragraphPages(text: string, max = PAGE_CHARS): string[] {
  if (text.length <= max) return [text];
  const starts = sentenceStarts(text);
  const count = Math.ceil(text.length / max);
  const target = text.length / count;
  const pages: string[] = [];
  let from = 0;
  for (let i = 1; i < starts.length && pages.length < count - 1; i++) {
    const at = starts[i] ?? 0;
    const next = starts[i + 1] ?? text.length;
    // Break before the sentence whose middle would pass this page's share.
    if ((at + next) / 2 - from > target) {
      pages.push(text.slice(from, at).trim());
      from = at;
    }
  }
  pages.push(text.slice(from).trim());
  return pages.filter((page) => page.length > 0);
}

export type Step =
  | { kind: 'title'; chapter: number }
  | { kind: 'narration'; chapter: number; paragraph: number; page: number }
  | { kind: 'line'; chapter: number; line: number }
  | { kind: 'fact'; chapter: number };

export function buildSteps(chapters: readonly Chapter[]): Step[] {
  const steps: Step[] = [];
  chapters.forEach((chapter, c) => {
    steps.push({ kind: 'title', chapter: c });
    chapter.narration.forEach((text, paragraph) =>
      paragraphPages(text).forEach((_, page) =>
        steps.push({ kind: 'narration', chapter: c, paragraph, page }),
      ),
    );
    chapter.lines.forEach((_, line) => steps.push({ kind: 'line', chapter: c, line }));
    if (chapter.fact) steps.push({ kind: 'fact', chapter: c });
  });
  return steps;
}

/** The text a step types out (title cards and facts appear at once). */
export function stepText(story: StopV3, step: Step): string {
  const chapter = story.chapters[step.chapter];
  if (!chapter) return '';
  switch (step.kind) {
    case 'title':
      return chapter.title;
    case 'narration':
      return paragraphPages(chapter.narration[step.paragraph] ?? '')[step.page] ?? '';
    case 'line':
      return chapter.lines[step.line]?.text ?? '';
    case 'fact':
      return chapter.fact?.text ?? '';
  }
}

/** Steps that type their text out letter by letter. */
/**
 * The picture a step shows (v2.4): a narration page whose paragraph names another place shows
 * that place (`chapter.narrationScenes` → `scene.places`); everything else shows the stop's scene.
 */
export function placeOf(
  story: StopV3 & { scene: { places?: Record<string, ScenePlace> } },
  step: Step,
): ScenePlace | undefined {
  if (step.kind !== 'narration') return undefined;
  const id = story.chapters[step.chapter]?.narrationScenes?.[step.paragraph];
  return id ? story.scene.places?.[id] : undefined;
}

export const types = (step: Step | undefined): boolean =>
  step?.kind === 'narration' || step?.kind === 'line';

/** How many chapters are fully read once the player has reached `index`. */
export function chaptersReadAt(steps: readonly Step[], index: number): number {
  const current = steps[index];
  if (!current) return 0;
  const isLastOfChapter = steps[index + 1]?.chapter !== current.chapter;
  return current.chapter + (isLastOfChapter ? 1 : 0);
}
