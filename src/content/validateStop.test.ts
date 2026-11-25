// SRS v2.3 §6.2b: the rules for each stop's chapters, lines and quiz (stops.json).
/* eslint-disable @typescript-eslint/no-explicit-any -- the tests break the raw JSON on purpose */
import { describe, expect, it } from 'vitest';
import { rawContent } from '../test/content';
import { formatProblem, validateContent, type RawContent } from './validate';

function check(edit: (raw: Record<string, any>) => void) {
  const raw = rawContent() as unknown as Record<string, any>;
  edit(raw);
  const result = validateContent(raw as RawContent);
  return {
    errors: result.errors.map(formatProblem),
    warnings: result.warnings.map(formatProblem),
  };
}

const stop = (raw: Record<string, any>, id: string) =>
  (raw.stops as { id: string }[]).find((s) => s.id === id) as Record<string, any>;

describe('stops.json chapters, lines and quiz (§6.2b)', () => {
  it('needs 4 chapters and at most 4 lines per chapter', () => {
    const three = check((raw) => {
      stop(raw, 'berlin-1887').chapters.pop();
    });
    expect(three.errors).toContain('stops.json › berlin-1887 › chapters: needs 4 chapters, has 3');
    const five = check((raw) => {
      const chapter = stop(raw, 'calamba-1861').chapters[0];
      chapter.lines = Array.from({ length: 5 }, () => chapter.lines[0]);
    });
    expect(five.errors).toContain(
      'stops.json › calamba-1861 › chapters[0].lines: use at most 4 lines per chapter',
    );
  });

  it('narration under 600 words: a warning in draft, an error when verified', () => {
    const short = (raw: Record<string, any>) => {
      const s = stop(raw, 'binan-1869');
      for (const chapter of s.chapters) chapter.narration = ['Too short.'];
      return s;
    };
    expect(check(short).warnings.join('\n')).toMatch(
      /binan-1869 › chapters: the narration has 8 words/,
    );
    const verified = check((raw) => {
      const s = short(raw);
      s.status = 'verified';
    });
    expect(verified.errors.join('\n')).toMatch(
      /binan-1869 › chapters: the narration has 8 words; it needs at least 600/,
    );
  });

  it('lines: 25 words at most, a valid mood, known speakers with portraits', () => {
    const { errors } = check((raw) => {
      const lines = stop(raw, 'calamba-1861').chapters[0].lines;
      lines[0].text = Array.from({ length: 26 }, () => 'word').join(' ');
      lines.push({ speaker: 'nobody', text: 'Hello.', mood: 'neutral', onScene: false });
    });
    expect(errors).toContain(
      'stops.json › calamba-1861 › chapters[0].lines[0].text: has 26 words; use 25 or fewer',
    );
    expect(errors).toContain(
      'stops.json › calamba-1861 › chapters[0].lines[1].speaker: "nobody" is not in characters.json',
    );

    const mood = check((raw) => {
      stop(raw, 'calamba-1861').chapters[0].lines[0].mood = 'angry';
    });
    expect(mood.errors.join('\n')).toMatch(/calamba-1861 › chapters\[0\]\.lines\[0\]\.mood/);
  });

  it('onScene needs a scene anchor, and offscreenOnly speakers are never on the scene', () => {
    const { errors } = check((raw) => {
      const lines = stop(raw, 'calamba-1861').chapters[0].lines;
      lines.push({ speaker: 'viola', text: 'Hello.', mood: 'neutral', onScene: true });
      lines.push({ speaker: 'paciano', text: 'Hello.', mood: 'neutral', onScene: true });
    });
    expect(errors).toContain(
      'stops.json › calamba-1861 › chapters[0].lines[1].onScene: "viola" has no entry in scene.speakerAnchors',
    );
    expect(errors).toContain(
      'stops.json › calamba-1861 › chapters[0].lines[2].onScene: "paciano" is offscreenOnly, so onScene must be false',
    );
  });

  it('every sourceId in lines, facts and questions is in sources.json', () => {
    const { errors } = check((raw) => {
      const s = stop(raw, 'calamba-1861');
      s.chapters[0].fact.sourceId = 'made-up';
      s.chapters[0].lines[0].recorded = { sourceId: 'also-made-up' };
      s.quiz[0].sourceId = 'not-a-source';
    });
    expect(errors).toContain(
      'stops.json › calamba-1861 › chapters[0].fact.sourceId: "made-up" is not in sources.json',
    );
    expect(errors).toContain(
      'stops.json › calamba-1861 › chapters[0].lines[0].recorded.sourceId: "also-made-up" is not in sources.json',
    );
    expect(errors).toContain(
      'stops.json › calamba-1861 › quiz[0].sourceId: "not-a-source" is not in sources.json',
    );
  });

  it('5 questions per stop, none on the final stop (GD-6)', () => {
    const { errors } = check((raw) => {
      stop(raw, 'berlin-1887').quiz.pop();
      stop(raw, 'bagumbayan-1896').quiz.push(stop(raw, 'berlin-1887').quiz[0]);
    });
    expect(errors).toContain('stops.json › berlin-1887 › quiz: needs 5 questions, has 4');
    expect(errors).toContain(
      'stops.json › bagumbayan-1896 › quiz: the final stop must have no quiz (SRS GD-6)',
    );
  });

  describe('question types', () => {
    const find = (raw: Record<string, any>, type: string) => {
      for (const s of raw.stops as Record<string, any>[]) {
        const index = (s.quiz as { type: string }[]).findIndex((q) => q.type === type);
        if (index >= 0) return { s, q: s.quiz[index], where: `${s.id} › quiz[${index}]` };
      }
      throw new Error(type);
    };

    it('mcq: 4 options and an answer that is one of them', () => {
      let where = '';
      const { errors } = check((raw) => {
        const found = find(raw, 'mcq');
        where = found.where;
        found.q.answer = 'z';
      });
      expect(errors.join('\n')).toContain(`${where}.answer: "z" does not match any option id`);
      const three = check((raw) => {
        const found = find(raw, 'mcq');
        where = found.where;
        found.q.options.pop();
      });
      expect(three.errors.join('\n')).toContain(`${where}.options: needs exactly 4 options`);
    });

    it('multi: 2 or more answers, but not every option', () => {
      let where = '';
      const { errors } = check((raw) => {
        const found = find(raw, 'multi');
        where = found.where;
        found.q.answers = found.q.options.map((o: { id: string }) => o.id);
      });
      expect(errors).toContain(`stops.json › ${where}.answers: cannot include every option`);
    });

    it('order: 3–5 items, answer in the written order', () => {
      let where = '';
      const { errors } = check((raw) => {
        const found = find(raw, 'order');
        where = found.where;
        found.q.answer = [...found.q.answer].reverse();
      });
      expect(errors.join('\n')).toContain(`${where}.answer: must list the item ids in the order`);
      const two = check((raw) => {
        const found = find(raw, 'order');
        where = found.where;
        found.q.items = found.q.items.slice(0, 2);
      });
      expect(two.errors.join('\n')).toContain(`${where}.items: needs 3 to 5 items`);
    });

    it('match: 3–4 pairs, each left and right used once', () => {
      let where = '';
      const { errors } = check((raw) => {
        const found = find(raw, 'match');
        where = found.where;
        const [first, second] = Object.keys(found.q.pairs);
        found.q.pairs[second as string] = found.q.pairs[first as string];
      });
      expect(errors.join('\n')).toContain(`${where}.pairs: right id`);
    });

    it('error: the answer is a segment id and the correction is not empty', () => {
      let where = '';
      const answer = check((raw) => {
        const found = find(raw, 'error');
        where = found.where;
        found.q.answer = 'nope';
      });
      expect(answer.errors.join('\n')).toContain(
        `${where}.answer: "nope" does not match any segment id`,
      );
      // An empty correction is caught by the schema, before the cross-file checks.
      const correction = check((raw) => {
        find(raw, 'error').q.correction = ' ';
      });
      expect(correction.errors.join('\n')).toContain(`${where}.correction: must not be empty`);
    });
  });
});
