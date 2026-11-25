// SRS v2.3 §3.8: what the player earns, and when. All amounts come from gamification.json.
// Each award updates saved progress, then checks achievements and rank; new ones are queued
// as celebrations (an achievement toast or a rank-up banner). Quiet achievements (GD-6) are
// recorded without a toast.
import type { BuilderProject, Content, Question, Stop } from '../content/schemas';
import type { Gamification } from '../content/schemas.v3';
import { useProgress, type Progress, type QuizResult, type StampGrade } from '../store/progress';
import { useUi } from '../store/ui';
import { answerXp, metAchievements, rankFor } from './rules';

export interface AnswerOutcome {
  xp: number;
  /** A streak of 5, 10, … was just reached (for Rizal's reaction). */
  streakMilestone?: number;
}

export interface Game {
  /** A question was answered. Replays of a completed stop earn nothing (§3.8, decision U5). */
  answer: (
    stop: Stop,
    question: Question,
    correct: boolean,
    attempts: number,
    hint: boolean,
  ) => AnswerOutcome;
  /** The quiz is done. Returns whether it was the first completion and whether it was perfect. */
  finishQuiz: (
    stop: Stop,
    results: readonly QuizResult[],
    grade: StampGrade,
  ) => { fresh: boolean; perfect: boolean };
  chaptersRead: (stop: Stop, count: number, quiet: boolean) => void;
  readMore: (stopId: string) => void;
  build: (project: BuilderProject) => void;
  /** Re-checks achievements (after reading in a language, loading a save code, …). */
  check: () => void;
}

export function makeGame(content: Content, rules: Gamification): Game {
  const store = useProgress;
  const addXp = (amount: number) => {
    if (amount > 0) store.setState((s) => ({ xp: s.xp + amount }));
  };

  /** Achievements and rank after a change; `xpBefore` decides a rank-up. */
  const settle = (xpBefore: number) => {
    const now = store.getState();
    const met = metAchievements(rules, { progress: now, content });
    const fresh = met.filter((id) => !now.achievements.includes(id));
    if (fresh.length > 0) store.setState({ achievements: [...now.achievements, ...fresh] });
    const { celebrate } = useUi.getState();
    for (const id of fresh) {
      if (!rules.achievements.find((a) => a.id === id)?.quiet)
        celebrate({ kind: 'achievement', id });
    }
    const before = rankFor(xpBefore, rules.ranks);
    const after = rankFor(now.xp, rules.ranks);
    if (after.id !== before.id && now.xp > xpBefore) celebrate({ kind: 'rank', id: after.id });
  };

  const withSettle =
    <A extends unknown[], R>(fn: (...args: A) => R) =>
    (...args: A): R => {
      const xpBefore = store.getState().xp;
      const result = fn(...args);
      settle(xpBefore);
      return result;
    };

  return {
    answer: withSettle((stop, question, correct, attempts, hint) => {
      const state: Progress = store.getState();
      if (state.completed.includes(stop.id)) return { xp: 0 };
      if (!correct) {
        store.setState({ streak: 0 });
        return { xp: 0 };
      }
      let xp = answerXp(attempts, hint, rules.xp);
      const { typeCorrect, skillCorrect } = state.quizStats;
      const streak = attempts === 1 ? state.streak + 1 : state.streak;
      const milestone =
        attempts === 1 && streak % rules.xp.streakBonusEvery === 0 ? streak : undefined;
      if (milestone) xp += rules.xp.streakBonus;
      store.setState({
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        quizStats: {
          typeCorrect: { ...typeCorrect, [question.type]: (typeCorrect[question.type] ?? 0) + 1 },
          skillCorrect: {
            ...skillCorrect,
            [question.skill]: (skillCorrect[question.skill] ?? 0) + 1,
          },
        },
      });
      addXp(xp);
      return { xp, streakMilestone: milestone };
    }),

    finishQuiz: withSettle((stop, results, grade) => {
      const fresh = store.getState().finishQuiz(stop, results, grade);
      const perfect = results.length > 0 && results.every((r) => r.attempts === 1);
      if (fresh && perfect) {
        store.setState((s) => ({ perfectStops: [...s.perfectStops, stop.id] }));
        addXp(rules.xp.perfectStopBonus);
      }
      return { fresh, perfect };
    }),

    chaptersRead: withSettle((stop, count, quiet) => {
      const before = store.getState().chaptersRead[stop.id] ?? 0;
      if (count <= before) return;
      store.getState().markChaptersRead(stop.id, count);
      // GD-6: the final stop is quiet: no XP, so no rank-up banner there.
      if (!quiet) addXp((count - before) * rules.xp.chapterRead);
    }),

    readMore: withSettle((stopId) => {
      if (store.getState().readMoreOpened.includes(stopId)) return;
      store.setState((s) => ({ readMoreOpened: [...s.readMoreOpened, stopId] }));
      addXp(rules.xp.readMoreOpened);
    }),

    build: withSettle((project) => {
      if (store.getState().builder[project]) return;
      store.getState().build(project);
      addXp(rules.xp.builderProject);
    }),

    check: withSettle(() => undefined),
  };
}
