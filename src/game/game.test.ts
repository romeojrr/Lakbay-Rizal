// FR-83 (SRS v2.3 §3.8): XP, streaks, stamps, ranks and achievements, from gamification.json.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PlayableStop } from '../content/schemas';
import { initialProgress, useProgress, type QuizResult } from '../store/progress';
import { useUi } from '../store/ui';
import { realContent, realContentV3 } from '../test/content';
import { makeGame } from './game';
import { answerXp, metAchievements, nextRank, parseRule, rankFor } from './rules';

const content = realContent();
const { gamification } = realContentV3();
const rules = gamification.xp;
const game = makeGame(content, gamification);
const stop = (id: string) => content.stops.find((s) => s.id === id) as PlayableStop;
const calamba = stop('calamba-1861');
const results = (attempts: number[]): QuizResult[] =>
  calamba.quiz.map((q, i) => ({
    id: q.id,
    type: q.type,
    skill: q.skill,
    attempts: attempts[i] ?? 1,
    hintOpened: false,
  }));

beforeEach(() => {
  useProgress.setState(initialProgress());
  useUi.setState({ celebrations: [] });
});
afterEach(() => useProgress.setState(initialProgress()));

describe('XP for answers (§3.8)', () => {
  it('follows gamification.json: first, second, later try; a hint costs points, never below 0', () => {
    expect(answerXp(1, false, rules)).toBe(rules.correctFirstTry);
    expect(answerXp(2, false, rules)).toBe(rules.correctSecondTry);
    expect(answerXp(5, false, rules)).toBe(rules.correctLaterTry);
    expect(answerXp(1, true, rules)).toBe(rules.correctFirstTry - rules.hintPenalty);
    expect(answerXp(3, true, { ...rules, hintPenalty: 99 })).toBe(0);
  });

  it('a wrong answer resets the streak; every 5 in a row adds the streak bonus', () => {
    const q = calamba.quiz[0];
    if (!q) throw new Error('quiz');
    for (let i = 0; i < 4; i++) game.answer(calamba, q, true, 1, false);
    expect(useProgress.getState().streak).toBe(4);
    const fifth = game.answer(calamba, q, true, 1, false);
    expect(fifth).toEqual({ xp: rules.correctFirstTry + rules.streakBonus, streakMilestone: 5 });
    expect(useProgress.getState()).toMatchObject({ streak: 5, bestStreak: 5 });
    game.answer(calamba, q, false, 1, false);
    expect(useProgress.getState()).toMatchObject({ streak: 0, bestStreak: 5 });
    expect(useProgress.getState().quizStats.typeCorrect.order).toBe(5);
  });

  it('a stop already completed earns nothing more when replayed', () => {
    useProgress.setState({ completed: ['calamba-1861'] });
    const q = calamba.quiz[1];
    if (!q) throw new Error('quiz');
    expect(game.answer(calamba, q, true, 1, false)).toEqual({ xp: 0 });
    expect(useProgress.getState().xp).toBe(0);
  });
});

describe('stamps, perfect stops and achievements (§3.8)', () => {
  it('a perfect stop: gold stamp, the perfect bonus and Sobresaliente', () => {
    const outcome = game.finishQuiz(calamba, results([1, 1, 1, 1, 1]), 'gold');
    expect(outcome).toEqual({ fresh: true, perfect: true });
    const s = useProgress.getState();
    expect(s.stampGrade['calamba-1861']).toBe('gold');
    expect(s.perfectStops).toEqual(['calamba-1861']);
    expect(s.xp).toBe(rules.perfectStopBonus);
    expect(s.achievements).toEqual(expect.arrayContaining(['first-steps', 'sobresaliente']));
    expect(useUi.getState().celebrations).toEqual(
      expect.arrayContaining([
        { kind: 'achievement', id: 'first-steps' },
        { kind: 'achievement', id: 'sobresaliente' },
      ]),
    );
  });

  it('a retry can turn a silver stamp gold, never the reverse', () => {
    game.finishQuiz(calamba, results([1, 2, 2, 1, 1]), 'silver');
    expect(useProgress.getState().stampGrade['calamba-1861']).toBe('silver');
    expect(game.finishQuiz(calamba, results([1, 1, 1, 1, 1]), 'gold').fresh).toBe(false);
    expect(useProgress.getState().stampGrade['calamba-1861']).toBe('gold');
    game.finishQuiz(calamba, results([2, 2, 2, 2, 2]), 'silver');
    expect(useProgress.getState().stampGrade['calamba-1861']).toBe('gold');
    // The perfect bonus comes with a first completion only.
    expect(useProgress.getState().perfectStops).toEqual([]);
  });

  it('chapters, Read more and builder projects give XP once', () => {
    game.chaptersRead(calamba, 2, false);
    game.chaptersRead(calamba, 1, false);
    game.readMore('calamba-1861');
    game.readMore('calamba-1861');
    game.build('clinic');
    game.build('clinic');
    expect(useProgress.getState().xp).toBe(
      2 * rules.chapterRead + rules.readMoreOpened + rules.builderProject,
    );
    // GD-6: the final stop gives no XP.
    game.chaptersRead(stop('bagumbayan-1896'), 4, true);
    expect(useProgress.getState().chaptersRead['bagumbayan-1896']).toBe(4);
  });

  it('the journey-end badge is quiet: no toast (GD-6)', () => {
    useProgress.setState({ completed: ['bagumbayan-1896'] });
    game.check();
    expect(useProgress.getState().achievements).toContain('journey-end');
    expect(useUi.getState().celebrations).not.toContainEqual({
      kind: 'achievement',
      id: 'journey-end',
    });
  });

  it('Polyglot: a stop read in English and Filipino', () => {
    useProgress.setState({ readIn: { 'calamba-1861': ['en', 'fil'] } });
    game.check();
    expect(useProgress.getState().achievements).toContain('bilingual');
  });
});

describe('ranks (§3.8)', () => {
  it('400 XP is Bachiller; the next rank is Manlalakbay', () => {
    expect(rankFor(0, gamification.ranks).title).toBe('Estudyante');
    expect(rankFor(399, gamification.ranks).title).toBe('Estudyante');
    expect(rankFor(400, gamification.ranks).title).toBe('Bachiller');
    expect(nextRank(400, gamification.ranks)?.title).toBe('Manlalakbay');
    expect(nextRank(5000, gamification.ranks)).toBeUndefined();
  });

  it('crossing a rank queues the rank-up banner', () => {
    useProgress.setState({ xp: 395 });
    game.readMore('berlin-1887');
    expect(useProgress.getState().xp).toBe(395 + rules.readMoreOpened);
    expect(useUi.getState().celebrations).toContainEqual({ kind: 'rank', id: 'bachiller' });
  });
});

describe('achievement rules', () => {
  it('the game understands every rule in gamification.json', () => {
    for (const achievement of gamification.achievements) {
      expect(parseRule(achievement.rule), achievement.rule).not.toBeNull();
    }
    expect(parseRule('nonsense >= 3')).toBeNull();
  });

  it('counts regions, items and stamps from the content', () => {
    const everything = {
      ...initialProgress(),
      completed: content.stops.map((s) => s.id),
      stamps: content.stops.map((s) => s.id).slice(0, 24),
      items: Object.keys(content.items),
      builder: { school: true, clinic: true, water: true },
    };
    const met = metAchievements(gamification, { progress: everything, content });
    expect(met).toEqual(
      expect.arrayContaining([
        'globetrotter',
        'collector',
        'full-passport',
        'builder',
        'journey-end',
      ]),
    );
    expect(met).not.toContain('safe-traveller');
  });
});
