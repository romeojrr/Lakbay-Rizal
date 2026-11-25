// SRS v2.3 §6.2b rules for one stop's chapters, lines and quiz (stops.json).
// Used by validate.ts; kept apart so each file stays readable.
import type { Content, PlayableStop, Question } from './schemas';

/** §6.4b: narration per stop. */
export const MIN_NARRATION_WORDS = 600;
const MAX_NARRATION_WORDS = 800;
const CHAPTERS_PER_STOP = 4;
const QUESTIONS_PER_STOP = 5;
const MAX_LINE_WORDS = 25;
/** The content script and this check split words a little differently (dashes). */
const WORD_COUNT_TOLERANCE = 5;

type Report = (field: string, message: string) => void;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function duplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const repeated = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

/** Chapters, narration and lines (§6.2b). */
export function checkChapters(stop: PlayableStop, content: Content, error: Report, warn: Report) {
  const sourceIds = new Set(content.sources.map((s) => s.id));
  const source = (field: string, id: string) => {
    if (!sourceIds.has(id)) error(field, `"${id}" is not in sources.json`);
  };

  if (stop.chapters.length !== CHAPTERS_PER_STOP) {
    error('chapters', `needs ${CHAPTERS_PER_STOP} chapters, has ${stop.chapters.length}`);
  }
  for (const id of duplicates(stop.chapters.map((c) => c.id))) {
    error('chapters', `chapter id "${id}" is used more than once`);
  }
  const words = stop.chapters.reduce(
    (sum, chapter) => sum + chapter.narration.reduce((n, p) => n + countWords(p), 0),
    0,
  );
  if (words < MIN_NARRATION_WORDS) {
    const message = `the narration has ${words} words; it needs at least ${MIN_NARRATION_WORDS}`;
    if (stop.status === 'verified') error('chapters', message);
    else warn('chapters', message);
  } else if (words > MAX_NARRATION_WORDS) {
    warn('chapters', `the narration has ${words} words; aim for 600–800 (SRS §6.4b)`);
  }
  if (Math.abs(words - stop.wordCount) > WORD_COUNT_TOLERANCE) {
    warn('wordCount', `says ${stop.wordCount}, but the narration has ${words} words`);
  }

  stop.chapters.forEach((chapter, ci) => {
    const ch = `chapters[${ci}]`;
    if (chapter.narration.length > 3) {
      warn(`${ch}.narration`, `has ${chapter.narration.length} paragraphs; use 1 to 3 (SRS §6.4b)`);
    }
    if (chapter.fact) source(`${ch}.fact.sourceId`, chapter.fact.sourceId);
    chapter.lines.forEach((line, li) => {
      const where = `${ch}.lines[${li}]`;
      const lineWords = countWords(line.text);
      if (lineWords > MAX_LINE_WORDS) {
        error(`${where}.text`, `has ${lineWords} words; use ${MAX_LINE_WORDS} or fewer`);
      }
      if (line.recorded) source(`${where}.recorded.sourceId`, line.recorded.sourceId);
      if (line.speaker === 'narrator') {
        if (line.onScene) error(`${where}.onScene`, 'the narrator is never on the scene');
        return;
      }
      const character = content.characters[line.speaker];
      if (!character) {
        error(`${where}.speaker`, `"${line.speaker}" is not in characters.json`);
        return;
      }
      if (!character.portrait) {
        error(`${where}.speaker`, `"${line.speaker}" has no portrait in characters.json`);
      }
      if (line.onScene && character.offscreenOnly) {
        error(`${where}.onScene`, `"${line.speaker}" is offscreenOnly, so onScene must be false`);
      } else if (line.onScene && !stop.scene.speakerAnchors?.[line.speaker]) {
        error(`${where}.onScene`, `"${line.speaker}" has no entry in scene.speakerAnchors`);
      }
    });
  });
}

/** The quiz (§6.2b, §6.4b, GD-6). */
export function checkQuiz(
  stop: PlayableStop,
  isFinal: boolean,
  content: Content,
  error: Report,
  warn: Report,
) {
  if (isFinal) {
    if (stop.quiz.length > 0) error('quiz', 'the final stop must have no quiz (SRS GD-6)');
    return;
  }
  if (stop.quiz.length !== QUESTIONS_PER_STOP) {
    error('quiz', `needs ${QUESTIONS_PER_STOP} questions, has ${stop.quiz.length}`);
  }
  for (const id of duplicates(stop.quiz.map((q) => q.id))) {
    error('quiz', `question id "${id}" is used more than once`);
  }
  stop.quiz.forEach((question, qi) => {
    if (!content.sources.some((s) => s.id === question.sourceId)) {
      error(`quiz[${qi}].sourceId`, `"${question.sourceId}" is not in sources.json`);
    }
    for (const problem of questionProblems(question)) {
      error(`quiz[${qi}]${problem.field}`, problem.message);
    }
  });

  // §6.4b: mix the types and skills.
  const types = new Set(stop.quiz.map((q) => q.type));
  const skills = new Set(stop.quiz.map((q) => q.skill));
  if (!types.has('order') && !types.has('match')) {
    warn('quiz', 'should have at least one "order" or "match" question (SRS §6.4b)');
  }
  if (!types.has('error')) warn('quiz', 'should have at least one "error" question (SRS §6.4b)');
  if (!skills.has('cause') && !skills.has('analysis') && !skills.has('source')) {
    warn('quiz', 'should have at least one cause, analysis or source question (SRS §6.4b)');
  }
}

/** §6.2b rules for each question type. `field` is appended to "quiz[n]". */
export function questionProblems(question: Question): { field: string; message: string }[] {
  const problems: { field: string; message: string }[] = [];
  const add = (field: string, message: string) => problems.push({ field, message });
  const checkIds = (field: string, ids: string[]) => {
    for (const id of duplicates(ids)) add(`.${field}`, `id "${id}" is used more than once`);
  };

  switch (question.type) {
    case 'mcq': {
      const ids = question.options.map((o) => o.id);
      checkIds('options', ids);
      if (!ids.includes(question.answer)) {
        add('.answer', `"${question.answer}" does not match any option id (${ids.join(', ')})`);
      }
      break;
    }
    case 'multi': {
      const ids = question.options.map((o) => o.id);
      checkIds('options', ids);
      checkIds('answers', question.answers);
      for (const answer of question.answers) {
        if (!ids.includes(answer)) add('.answers', `"${answer}" does not match any option id`);
      }
      if (new Set(question.answers).size >= ids.length) {
        add('.answers', 'cannot include every option');
      }
      break;
    }
    case 'order': {
      const ids = question.items.map((item) => item.id);
      checkIds('items', ids);
      // Items are listed in the correct order, and `answer` says the same.
      if (question.answer.join() !== ids.join()) {
        add(
          '.answer',
          `must list the item ids in the order the items are written (${ids.join(', ')})`,
        );
      }
      break;
    }
    case 'match': {
      const left = question.left.map((l) => l.id);
      const right = question.right.map((r) => r.id);
      checkIds('left', left);
      checkIds('right', right);
      const pairs = Object.entries(question.pairs);
      if (pairs.length < 3 || pairs.length > 4)
        add('.pairs', `needs 3 or 4 pairs, has ${pairs.length}`);
      if (left.length !== pairs.length || right.length !== pairs.length) {
        add('.pairs', 'every left and right entry needs exactly one pair');
      }
      for (const [from, to] of pairs) {
        if (!left.includes(from)) add('.pairs', `"${from}" is not a left id`);
        if (!right.includes(to)) add('.pairs', `"${to}" is not a right id`);
      }
      for (const id of duplicates(pairs.map(([, to]) => to))) {
        add('.pairs', `right id "${id}" is paired more than once`);
      }
      break;
    }
    case 'error': {
      const ids = question.segments.map((s) => s.id);
      checkIds('segments', ids);
      if (!ids.includes(question.answer)) {
        add('.answer', `"${question.answer}" does not match any segment id (${ids.join(', ')})`);
      }
      break;
    }
  }
  return problems;
}
