// SRS v2.3 §3.8: XP, ranks and achievements. Every number and rule comes from
// gamification.json; this file only knows how to read them.
import type { Content } from '../content/schemas';
import type { Gamification } from '../content/schemas.v3';
import type { Progress } from '../store/progress';

type Rank = Gamification['ranks'][number];

/** The rank for an XP total: the highest whose minXp is reached. */
export function rankFor(xp: number, ranks: readonly Rank[]): Rank {
  let current = ranks[0] as Rank;
  for (const rank of ranks) if (xp >= rank.minXp) current = rank;
  return current;
}

export function nextRank(xp: number, ranks: readonly Rank[]): Rank | undefined {
  return ranks.find((rank) => rank.minXp > xp);
}

/** XP for a question answered right on try `attempts` (§3.8; never below 0 for a question). */
export function answerXp(attempts: number, hintOpened: boolean, xp: Gamification['xp']): number {
  const base =
    attempts === 1 ? xp.correctFirstTry : attempts === 2 ? xp.correctSecondTry : xp.correctLaterTry;
  return Math.max(0, base - (hintOpened ? xp.hintPenalty : 0));
}

// --- Achievement rules -------------------------------------------------------------
// The rule strings in gamification.json, e.g. "completed >= 1", "typeCorrect.error >= 10",
// "completed includes bagumbayan-1896", "builder.all".

type Facts = {
  progress: Pick<
    Progress,
    | 'completed'
    | 'stamps'
    | 'items'
    | 'bestStreak'
    | 'readMoreOpened'
    | 'quizStats'
    | 'builder'
    | 'readIn'
    | 'save'
    | 'perfectStops'
  >;
  content: Pick<Content, 'stops' | 'items'>;
};

const FLAGS: Record<string, (f: Facts) => boolean> = {
  anyPerfectStop: (f) => f.progress.perfectStops.length > 0,
  'builder.all': (f) => Object.values(f.progress.builder).every(Boolean),
  readInBothLanguages: (f) =>
    Object.values(f.progress.readIn).some((langs) => langs.includes('en') && langs.includes('fil')),
  exportedSave: (f) => f.progress.save.lastExportAt !== undefined,
};

function count(path: string, f: Facts): number | undefined {
  const { progress } = f;
  const [head, key] = path.split('.');
  switch (head) {
    case 'completed':
      return progress.completed.length;
    case 'stamps':
      return progress.stamps.length;
    case 'items':
      return progress.items.length;
    case 'allItems':
      return Object.keys(f.content.items).length;
    case 'bestStreak':
      return progress.bestStreak;
    case 'readMoreOpened':
      return progress.readMoreOpened.length;
    case 'typeCorrect':
      return key ? (progress.quizStats.typeCorrect[key] ?? 0) : undefined;
    case 'skillCorrect':
      return key ? (progress.quizStats.skillCorrect[key] ?? 0) : undefined;
    case 'regionsCompleted':
      return new Set(
        f.content.stops.filter((s) => progress.completed.includes(s.id)).map((s) => s.region),
      ).size;
    default:
      return /^\d+$/.test(path) ? Number(path) : undefined;
  }
}

/** Turns a rule into a test, or null when the rule is not understood. */
export function parseRule(rule: string): ((f: Facts) => boolean) | null {
  const flag = FLAGS[rule.trim()];
  if (flag) return flag;
  const includes = /^completed includes ([a-z0-9-]+)$/.exec(rule.trim());
  if (includes) return (f) => f.progress.completed.includes(includes[1] as string);
  const compare = /^([\w.]+) (>=|==) ([\w.]+)$/.exec(rule.trim());
  if (!compare) return null;
  const [, left, op, right] = compare as unknown as [string, string, string, string];
  const probe: Facts = {
    progress: {
      completed: [],
      stamps: [],
      items: [],
      bestStreak: 0,
      readMoreOpened: [],
      quizStats: { typeCorrect: {}, skillCorrect: {} },
      builder: { school: false, clinic: false, water: false },
      readIn: {},
      save: { remindersOn: true },
      perfectStops: [],
    },
    content: { stops: [], items: {} },
  };
  if (count(left, probe) === undefined || count(right, probe) === undefined) return null;
  return (f) => {
    const a = count(left, f) ?? 0;
    const b = count(right, f) ?? 0;
    return op === '>=' ? a >= b : a === b;
  };
}

/** Ids of every achievement whose rule is met now. */
export function metAchievements(gamification: Gamification, facts: Facts): string[] {
  return gamification.achievements
    .filter((achievement) => parseRule(achievement.rule)?.(facts) ?? false)
    .map((achievement) => achievement.id);
}
