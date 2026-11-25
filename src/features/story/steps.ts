// SRS v2.3 §3.6: a stop's story, one step at a time:
// chapter title card → narration paragraphs → dialogue lines → "Did you know?" fact → next chapter.
import type { Chapter, StopV3 } from '../../content/schemas.v3';

export type Step =
  | { kind: 'title'; chapter: number }
  | { kind: 'narration'; chapter: number; paragraph: number }
  | { kind: 'line'; chapter: number; line: number }
  | { kind: 'fact'; chapter: number };

export function buildSteps(chapters: readonly Chapter[]): Step[] {
  const steps: Step[] = [];
  chapters.forEach((chapter, c) => {
    steps.push({ kind: 'title', chapter: c });
    chapter.narration.forEach((_, paragraph) =>
      steps.push({ kind: 'narration', chapter: c, paragraph }),
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
      return chapter.narration[step.paragraph] ?? '';
    case 'line':
      return chapter.lines[step.line]?.text ?? '';
    case 'fact':
      return chapter.fact?.text ?? '';
  }
}

/** Steps that type their text out letter by letter. */
export const types = (step: Step | undefined): boolean =>
  step?.kind === 'narration' || step?.kind === 'line';

/** How many chapters are fully read once the player has reached `index`. */
export function chaptersReadAt(steps: readonly Step[], index: number): number {
  const current = steps[index];
  if (!current) return 0;
  const isLastOfChapter = steps[index + 1]?.chapter !== current.chapter;
  return current.chapter + (isLastOfChapter ? 1 : 0);
}
