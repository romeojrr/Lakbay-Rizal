// SRS v2.3 §6.2b: the content v3 rules, checked against the real files and broken copies.
/* eslint-disable @typescript-eslint/no-explicit-any -- the tests break the raw JSON on purpose */
import { describe, expect, it } from 'vitest';
import { rawContentV3, realContent } from '../test/content';
import type { AssetInfo } from './validate';
import { formatProblem } from './validate';
import { validateContentV3, type RawV3Content } from './validate.v3';

const base = realContent();

/** Every PNG exists at its expected size unless `sizes` says otherwise. */
const assets =
  (sizes: Record<string, AssetInfo | null> = {}) =>
  (path: string): AssetInfo | null =>
    path in sizes
      ? (sizes[path] ?? null)
      : path.startsWith('/assets/portraits/')
        ? { width: 256, height: 384 }
        : { width: 384, height: 216 };

function check(edit: (raw: Record<string, any>) => void, options = {}) {
  const raw = rawContentV3() as unknown as Record<string, any>;
  edit(raw);
  const result = validateContentV3(raw as RawV3Content, base, options);
  return {
    errors: result.errors.map(formatProblem),
    warnings: result.warnings.map(formatProblem),
  };
}

const stop = (raw: Record<string, any>, id: string) =>
  (raw['stops.v3'] as { id: string }[]).find((s) => s.id === id) as Record<string, any>;
const filStop = (raw: Record<string, any>, id: string) => raw['i18n/fil.stops'].stops[id];

describe('content v3 (§6.2b)', () => {
  it('the real files pass, with portraits checked', () => {
    const result = validateContentV3(rawContentV3(), base, { assetInfo: assets() });
    expect(result.errors.map(formatProblem)).toEqual([]);
    expect(result.content?.['stops.v3']).toHaveLength(25);
    expect(result.content?.['stops.v3'].reduce((n, s) => n + s.quiz.length, 0)).toBe(120);
  });

  it('needs 4 chapters and at most 4 lines per chapter', () => {
    const three = check((raw) => {
      stop(raw, 'berlin-1887').chapters.pop();
    });
    expect(three.errors).toContain(
      'stops.v3.json › berlin-1887 › chapters: needs 4 chapters, has 3',
    );
    const five = check((raw) => {
      const chapter = stop(raw, 'calamba-1861').chapters[0];
      chapter.lines = Array.from({ length: 5 }, () => chapter.lines[0]);
    });
    expect(five.errors).toContain(
      'stops.v3.json › calamba-1861 › chapters[0].lines: use at most 4 lines per chapter',
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
      'stops.v3.json › calamba-1861 › chapters[0].lines[0].text: has 26 words; use 25 or fewer',
    );
    expect(errors).toContain(
      'stops.v3.json › calamba-1861 › chapters[0].lines[1].speaker: "nobody" is not in characters.json',
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
      'stops.v3.json › calamba-1861 › chapters[0].lines[1].onScene: "viola" has no entry in scene.speakerAnchors',
    );
    expect(errors).toContain(
      'stops.v3.json › calamba-1861 › chapters[0].lines[2].onScene: "paciano" is offscreenOnly, so onScene must be false',
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
      'stops.v3.json › calamba-1861 › chapters[0].fact.sourceId: "made-up" is not in sources.json',
    );
    expect(errors).toContain(
      'stops.v3.json › calamba-1861 › chapters[0].lines[0].recorded.sourceId: "also-made-up" is not in sources.json',
    );
    expect(errors).toContain(
      'stops.v3.json › calamba-1861 › quiz[0].sourceId: "not-a-source" is not in sources.json',
    );
  });

  it('5 questions per stop, none on the final stop (GD-6)', () => {
    const { errors } = check((raw) => {
      stop(raw, 'berlin-1887').quiz.pop();
      stop(raw, 'bagumbayan-1896').quiz.push(stop(raw, 'berlin-1887').quiz[0]);
    });
    expect(errors).toContain('stops.v3.json › berlin-1887 › quiz: needs 5 questions, has 4');
    expect(errors).toContain(
      'stops.v3.json › bagumbayan-1896 › quiz: the final stop must have no quiz (SRS GD-6)',
    );
  });

  describe('question types', () => {
    const find = (raw: Record<string, any>, type: string) => {
      for (const s of raw['stops.v3'] as Record<string, any>[]) {
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
      expect(errors).toContain(`stops.v3.json › ${where}.answers: cannot include every option`);
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

  it('guide: known data-guide targets and every tip the game needs (§3.7)', () => {
    const { errors } = check((raw) => {
      raw.guide.tour[1].target = 'nowhere';
    });
    expect(errors.join('\n')).toContain('guide.json › tour[1].target');
    const tips = check((raw) => {
      delete raw.guide.tips['rank-up'];
    });
    expect(tips.errors).toContain('guide.json › tips › rank-up: this tip is missing (SRS §3.7)');
  });

  it('gamification: ranks from 0 XP upwards, achievement icons from items.json (§3.8)', () => {
    const { errors } = check((raw) => {
      raw.gamification.ranks[2].minXp = 100;
      raw.gamification.achievements[0].icon = 'no-such-item';
    });
    expect(errors).toContain(
      'gamification.json › ranks[2].minXp: ranks must be listed from the lowest XP up',
    );
    expect(errors.join('\n')).toContain('"no-such-item" is not an item in items.json');
  });

  it('portraits: each sheet exists and is 4 × 6 frames of 64 px (§7.10)', () => {
    const { errors } = check(() => {}, {
      assetInfo: assets({
        '/assets/portraits/viola.png': null,
        '/assets/portraits/luna.png': { width: 192, height: 384 },
      }),
    });
    expect(errors).toContain(
      'characters.json › viola › portrait: /assets/portraits/viola.png does not exist in assets/',
    );
    expect(errors.join('\n')).toContain(
      '/assets/portraits/luna.png is 192 × 384; a portrait sheet is 256 × 384',
    );
  });
});

describe('Filipino mirror check (§6.2b, §3.10)', () => {
  it('needs every stop, and no extra ones', () => {
    const { errors } = check((raw) => {
      delete raw['i18n/fil.stops'].stops['calamba-1861'];
      raw['i18n/fil.stops'].stops['nowhere-1900'] = {};
    });
    expect(errors).toContain('i18n/fil.stops.json › calamba-1861: this stop is missing');
    expect(errors).toContain('i18n/fil.stops.json › nowhere-1900: is not a stop in stops.v3.json');
  });

  it('chapters, paragraphs, lines and facts line up with the English', () => {
    const { errors } = check((raw) => {
      const fil = filStop(raw, 'calamba-1861');
      fil.chapters[0].narration.push('Dagdag.');
      fil.chapters[0].lines = [];
      delete fil.chapters[0].fact;
      filStop(raw, 'binan-1869').chapters.pop();
    });
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › chapters[0].narration: has 3 paragraphs; stops.v3.json has 2',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › chapters[0].lines: has 0 lines; stops.v3.json has 1',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › chapters[0].fact: is missing; the English chapter has a fact',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › binan-1869 › chapters: has 3 chapters; stops.v3.json has 4',
    );
  });

  it('questions and their options, items, pairs and segments line up', () => {
    const { errors } = check((raw) => {
      const fil = filStop(raw, 'calamba-1861');
      // calamba-1861: q1 is "order", q2 "mcq", q4 "error".
      fil.quiz[0].items.pop();
      fil.quiz[1].options.push('Isa pa');
      fil.quiz[3].options = ['a', 'b'];
      filStop(raw, 'berlin-1887').quiz.pop();
    });
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › quiz[0].items: has 3 items; stops.v3.json has 4',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › quiz[1].options: has 5 options; stops.v3.json has 4',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › quiz[3].options: a "error" question has no options',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › berlin-1887 › quiz: has 4 questions; stops.v3.json has 5',
    );
  });

  it('translated names, guide steps and achievements must exist in the English files', () => {
    const { errors } = check((raw) => {
      raw['i18n/fil.stops'].items['no-item'] = { name: 'Wala' };
      raw['i18n/fil.guide'].tour.t99 = 'Wala';
      raw['i18n/fil.guide'].reactions.correct.pop();
      raw['i18n/fil.gamification'].achievements['no-badge'] = { title: 'Wala' };
    });
    expect(errors).toContain('i18n/fil.stops.json › items › no-item: is not in items.json');
    expect(errors).toContain('i18n/fil.guide.json › tour › t99: is not a step in guide.json');
    expect(errors).toContain(
      'i18n/fil.guide.json › reactions › correct: has 3 lines; guide.json has 4',
    );
    expect(errors).toContain(
      'i18n/fil.gamification.json › achievements › no-badge: is not an achievement in gamification.json',
    );
  });

  it('status must be "draft" or "reviewed"', () => {
    const { errors } = check((raw) => {
      raw['i18n/fil.guide'].status = 'done';
    });
    expect(errors.join('\n')).toContain('i18n/fil.guide.json › status');
  });
});
