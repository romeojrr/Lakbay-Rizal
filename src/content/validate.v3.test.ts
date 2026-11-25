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

const filStop = (raw: Record<string, any>, id: string) => raw['i18n/fil.stops'].stops[id];

describe('guide, gamification and portraits (§3.7, §3.8, §7.10)', () => {
  it('the real files pass, with portraits checked', () => {
    const result = validateContentV3(rawContentV3(), base, { assetInfo: assets() });
    expect(result.errors.map(formatProblem)).toEqual([]);
    expect(result.content?.guide.tour).toHaveLength(14);
    expect(result.content?.gamification.achievements).toHaveLength(14);
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
    expect(errors).toContain('i18n/fil.stops.json › nowhere-1900: is not a stop in stops.json');
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
      'i18n/fil.stops.json › calamba-1861 › chapters[0].narration: has 3 paragraphs; stops.json has 2',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › chapters[0].lines: has 0 lines; stops.json has 1',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › chapters[0].fact: is missing; the English chapter has a fact',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › binan-1869 › chapters: has 3 chapters; stops.json has 4',
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
      'i18n/fil.stops.json › calamba-1861 › quiz[0].items: has 3 items; stops.json has 4',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › quiz[1].options: has 5 options; stops.json has 4',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › calamba-1861 › quiz[3].options: a "error" question has no options',
    );
    expect(errors).toContain(
      'i18n/fil.stops.json › berlin-1887 › quiz: has 4 questions; stops.json has 5',
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
