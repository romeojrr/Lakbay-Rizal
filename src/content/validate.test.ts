import { describe, expect, it } from 'vitest';
import { rawContent } from '../test/content';
import { formatProblem, validateContent, type AssetInfo, type RawContent } from './validate';

type Json = Record<string, unknown>;

function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('test fixture is missing an expected entry');
  return value;
}

function stopIn(raw: RawContent, id: string): Json {
  const stop = (raw.stops as Json[]).find((s) => s.id === id);
  if (!stop) throw new Error(`no stop ${id}`);
  return stop;
}

function errorsFor(raw: RawContent, assetInfo?: (path: string) => AssetInfo | null): string[] {
  return validateContent(raw, { assetInfo }).errors.map(formatProblem);
}

describe('validateContent — the seed', () => {
  it('passes with no errors', () => {
    const result = validateContent(rawContent());
    expect(result.errors.map(formatProblem)).toEqual([]);
    expect(result.content?.stops).toHaveLength(25);
  });

  it('warns only about the §6.4b writing rules the content pack does not meet yet', () => {
    const { warnings } = validateContent(rawContent());
    expect(warnings.map(formatProblem)).toEqual([
      expect.stringContaining('ust-1877 › quiz: should have at least one "error" question'),
      expect.stringContaining(
        'heidelberg-1886 › quiz: should have at least one "order" or "match"',
      ),
      expect.stringContaining('wilhelmsfeld-1886 › chapters[3].narration: has 4 paragraphs'),
      expect.stringContaining('biarritz-1891 › quiz: should have at least one "order" or "match"'),
      expect.stringContaining('ghent-1891 › chapters[3].narration: has 4 paragraphs'),
    ]);
  });
});

describe('validateContent — schema errors name the stop and field', () => {
  it('a quiz answer that matches no option', () => {
    const raw = rawContent();
    const quiz = stopIn(raw, 'calamba-1861').quiz as Json[];
    quiz[1] = { ...quiz[1], answer: 'e' }; // calamba-1861 q2 is an mcq
    expect(errorsFor(raw)).toEqual([
      'stops.json › calamba-1861 › quiz[1].answer: "e" does not match any option id (a, b, c, d)',
    ]);
  });

  it('a misspelled theme value', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').theme = 'writng';
    const [error] = errorsFor(raw);
    expect(error).toMatch(/^stops\.json › berlin-1887 › theme: /);
    expect(error).toContain('writing');
  });

  it('a misspelled key', () => {
    const raw = rawContent();
    const stop = stopIn(raw, 'berlin-1887');
    stop.teasr = stop.teaser;
    delete stop.teaser;
    const errors = errorsFor(raw);
    expect(errors).toContainEqual(expect.stringMatching(/^stops\.json › berlin-1887 › teaser: /));
    expect(errors).toContainEqual(
      expect.stringMatching(/^stops\.json › berlin-1887: .*Unrecognized key.*teasr/),
    );
  });

  it('a title longer than 32 characters', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').title = 'x'.repeat(33);
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › title: must be 32 characters or fewer',
    ]);
  });

  it('an unknown status', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').status = 'done';
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › status: status must be "outline", "draft" or "verified"',
    ]);
  });

  it('a broken field in another file', () => {
    const raw = rawContent();
    must((raw.items as Record<string, Json>)['noli-me-tangere']).icon = 'noli.png';
    expect(errorsFor(raw)).toEqual([
      'items.json › noli-me-tangere › icon: must be a PNG path like /assets/scenes/berlin_1887.png',
    ]);
  });
});

describe('validateContent — cross-file rules (SRS §6.2)', () => {
  it('a speaker missing from characters.json', () => {
    const raw = rawContent();
    const chapter = must((stopIn(raw, 'berlin-1887').chapters as { lines: Json[] }[])[0]);
    must(chapter.lines[0]).speaker = 'ghost';
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › chapters[0].lines[0].speaker: "ghost" is not in characters.json',
    ]);
  });

  it('a reward item missing from items.json', () => {
    const raw = rawContent();
    (stopIn(raw, 'berlin-1887').rewards as Json).item = 'golden-pen';
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › rewards.item: "golden-pen" is not in items.json',
    ]);
  });

  it('a source id missing from sources.json', () => {
    const raw = rawContent();
    must((stopIn(raw, 'berlin-1887').sources as Json[])[0]).sourceId = 'my-blog';
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › sources[0].sourceId: "my-blog" is not in sources.json',
    ]);
  });

  it('a repeated order, which also leaves a gap', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').order = 12;
    expect(errorsFor(raw)).toEqual([
      'stops.json › order 12: this order is used by more than one stop',
      'stops.json › order: orders must run 1 to 25 with no gaps; 11 is missing',
    ]);
  });

  it('a quiz on the final stop (GD-6)', () => {
    const raw = rawContent();
    const berlinQuiz = stopIn(raw, 'berlin-1887').quiz;
    stopIn(raw, 'bagumbayan-1896').quiz = berlinQuiz;
    expect(errorsFor(raw)).toEqual([
      'stops.json › bagumbayan-1896 › quiz: the final stop must have no quiz (SRS GD-6)',
    ]);
  });

  it('no quiz on a stop that is not the last', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').quiz = [];
    expect(errorsFor(raw)).toEqual(['stops.json › berlin-1887 › quiz: needs 5 questions, has 0']);
  });

  it('a place outside its region map', () => {
    const raw = rawContent();
    (stopIn(raw, 'berlin-1887').place as Json).lat = 10;
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › place: lat/lon fall outside the Europe map',
    ]);
  });

  it('a source on a banned site (SRS §14.1)', () => {
    const raw = rawContent();
    must((raw.sources as Json[])[0]).urls = ['https://www.scribd.com/doc/123'];
    expect(errorsFor(raw)).toEqual([
      'sources.json › epistolario › urls[0]: www.scribd.com may not be cited (SRS §14.1)',
    ]);
  });

  it('story length: a warning for drafts', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').story = 'Too short.';
    const result = validateContent(raw);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map(formatProblem)).toContain(
      'stops.json › berlin-1887 › story: has 2 words; it should be 100–150',
    );
  });

  it('verified stops need page numbers, a Tier 1/2 source and no verify notes', () => {
    const raw = rawContent();
    stopIn(raw, 'berlin-1887').status = 'verified';
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › sources[0].pages: "rizal-blumentritt" is a book; add page numbers',
      'stops.json › berlin-1887 › sources[2].pages: "guerrero" is a book; add page numbers',
      'stops.json › berlin-1887 › sources[3].pages: "zaide" is a book; add page numbers',
      'stops.json › berlin-1887 › verifyNotes: a verified stop must have no verifyNotes left',
    ]);
  });

  it('story length: an error for verified stops', () => {
    const raw = rawContent();
    const stop = stopIn(raw, 'berlin-1887');
    stop.status = 'verified';
    stop.verifyNotes = [];
    stop.sources = [
      { sourceId: 'nhcp-viola', pages: '' },
      { sourceId: 'craig-1913', pages: '', chapter: 'ch. VI' },
    ];
    stop.story = 'Too short.';
    expect(errorsFor(raw)).toEqual([
      'stops.json › berlin-1887 › story: has 2 words; it should be 100–150',
    ]);
  });
});

describe('validateContent — assets', () => {
  const realSize = (path: string): AssetInfo => {
    if (path.includes('/scenes/')) return { width: 384, height: 216 };
    if (path.includes('/icons/')) return { width: 26, height: 26 };
    if (path.endsWith('manila_laguna_inset.png')) return { width: 176, height: 176 };
    const maps: Record<string, AssetInfo> = {
      'europe.png': { width: 384, height: 288 },
      'philippines.png': { width: 320, height: 320 },
      'asia.png': { width: 384, height: 240 },
      'america.png': { width: 384, height: 192 },
    };
    return maps[path.split('/').at(-1) ?? ''] ?? { width: 34, height: 78 };
  };

  it('passes when every file exists at the right size', () => {
    expect(errorsFor(rawContent(), realSize)).toEqual([]);
  });

  it('rejects a scene over 60 KB (NFR-1)', () => {
    const assetInfo = (path: string) =>
      path === '/assets/scenes/berlin_1887.png'
        ? { width: 384, height: 216, bytes: 61 * 1024 }
        : realSize(path);
    expect(errorsFor(rawContent(), assetInfo)).toEqual([
      'stops.json › berlin-1887 › scene.image: /assets/scenes/berlin_1887.png is 61 KB; scenes must be 60 KB or less (NFR-1)',
    ]);
  });

  it('reports a missing file and a wrong size', () => {
    const assetInfo = (path: string) => {
      if (path === '/assets/scenes/berlin_1887.png') return null;
      if (path === '/assets/icons/stamp_berlin.png') return { width: 32, height: 32 };
      return realSize(path);
    };
    expect(errorsFor(rawContent(), assetInfo)).toEqual([
      'stops.json › berlin-1887 › scene.image: /assets/scenes/berlin_1887.png does not exist in assets/',
      'stops.json › berlin-1887 › rewards.stamp.icon: /assets/icons/stamp_berlin.png is 32 × 32; expected 26 × 26',
    ]);
  });
});
