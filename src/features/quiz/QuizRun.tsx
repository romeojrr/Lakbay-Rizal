import { useEffect, useRef, useState } from 'react';
import BackLink from '../../components/BackLink/BackLink';
import QuizQuestion from '../../components/QuizQuestion/QuizQuestion';
import RewardCard from '../../components/RewardCard/RewardCard';
import type { Content, PlayableStop, Question } from '../../content/schemas';
import { t } from '../../i18n/t';
import { useRootData } from '../../app/useRootData';
import { useGame } from '../../game/useGame';
import { useUi } from '../../store/ui';
import Feedback from './Feedback';
import RizalReaction, { pickReaction, type Reaction, type ReactionKind } from './RizalReaction';
import ChoiceInput, { type Status } from './inputs/ChoiceInput';
import ErrorInput from './inputs/ErrorInput';
import MatchInput from './inputs/MatchInput';
import OrderInput from './inputs/OrderInput';
import { isCorrect, prepare, stampGrade, type Answer, type QuestionResult } from './quizModel';
import styles from './QuizPage.module.css';
import { useTip } from '../guide/TipBubble';

interface QuizRunProps {
  stop: PlayableStop;
  content: Content;
}

const INSTRUCTION = {
  mcq: 'quiz.pick',
  multi: 'quiz.multi',
  order: 'quiz.order',
  match: 'quiz.match',
  error: 'quiz.error',
} as const;

function AnswerInput(props: { question: Question; status: Status; onAnswer: (a: Answer) => void }) {
  const { question } = props;
  switch (question.type) {
    case 'mcq':
    case 'multi':
      return <ChoiceInput {...props} question={question} />;
    case 'order':
      return <OrderInput {...props} question={question} />;
    case 'match':
      return <MatchInput {...props} question={question} />;
    case 'error':
      return <ErrorInput {...props} question={question} />;
  }
}

/**
 * One question at a time, in content order (FR-40). A wrong answer shows a hint button and
 * Try again, with no penalty (GD-5, FR-42); a right one shows why and the source (FR-81).
 * Every attempt is shuffled again (FR-82). First-try results decide the stamp (§3.8).
 */
export default function QuizRun({ stop, content }: QuizRunProps) {
  useTip('quiz-first'); // §3.7: a one-time hint from Rizal
  const game = useGame();
  const { guide, gamification } = useRootData();
  const [gained, setGained] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [prepared, setPrepared] = useState(() => stop.quiz.map((q) => prepare(q)));
  const [status, setStatus] = useState<Status>('answering');
  const [hintOpen, setHintOpen] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [reward, setReward] = useState<{ fresh: boolean; grade: 'gold' | 'silver' } | null>(null);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const feedbackRef = useRef<HTMLHeadingElement>(null);
  const rewardRef = useRef<HTMLHeadingElement>(null);
  const previous = useRef({ index, status, reward });

  const question = prepared[index];
  const total = prepared.length;
  const isLast = index === total - 1;

  // Move focus to whatever just changed (not on mount, which React may run twice).
  useEffect(() => {
    const before = previous.current;
    previous.current = { index, status, reward };
    if (before.index === index && before.status === status && before.reward === reward) return;
    if (reward) rewardRef.current?.focus();
    else if (status !== 'answering') feedbackRef.current?.focus();
    else promptRef.current?.focus();
  }, [index, status, reward]);

  // §3.9: once an answer is checked and until the reward, leaving would lose the quiz.
  const inProgress = !reward && (results.length > 0 || status !== 'answering');
  useEffect(() => {
    useUi.getState().setUnsaved(inProgress);
    return () => useUi.getState().setUnsaved(false);
  }, [inProgress]);

  if (!question) return null;

  const react = (kind: ReactionKind, streak?: number) =>
    setReaction({ kind, index: pickReaction(guide, kind, streak), key: Date.now() });

  const answer = (given: Answer) => {
    const right = isCorrect(question, given);
    setStatus(right ? 'right' : 'wrong');
    // §3.8 XP and streak; §3.7 Rizal reacts (a streak of 5 or 10 beats a plain "correct").
    const outcome = game.answer(stop, question, right, attempt, hintOpen);
    setGained(outcome.xp);
    if (outcome.streakMilestone) react('streak', outcome.streakMilestone);
    else react(right ? 'correct' : 'wrong');
    if (right) {
      setResults((list) => [
        ...list,
        {
          id: question.id,
          type: question.type,
          skill: question.skill,
          attempts: attempt,
          hintOpened: hintOpen,
        },
      ]);
    }
  };

  const tryAgain = () => {
    // GD-5 / FR-42: no penalty; the same question comes back, shuffled again (FR-82).
    setPrepared(prepared.map((q, i) => (i === index ? prepare(stop.quiz[i] ?? q) : q)));
    setAttempt(attempt + 1);
    setStatus('answering');
  };

  const next = () => {
    if (!isLast) {
      setIndex(index + 1);
      setAttempt(1);
      setHintOpen(false);
      setStatus('answering');
      return;
    }
    // FR-43: the progress store is updated once; a better grade replaces a silver stamp.
    const grade = stampGrade(results, gamification.quizPass);
    const { fresh, perfect } = game.finishQuiz(stop, results, grade);
    setReward({ fresh, grade });
    if (perfect) react('perfect');
    else setReaction(null);
  };

  const done = index + (status === 'right' || reward ? 1 : 0);
  const source = content.sources.find((s) => s.id === question.sourceId);
  const item = stop.rewards.item ? content.items[stop.rewards.item] : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <BackLink fallback={`/stop/${stop.id}`} label={t('quiz.backToStory')} />
      </div>
      <div className={styles.head}>
        <h1 className={styles.title}>{t('quiz.title', { place: stop.place.label })}</h1>
        <div className={styles.bar} aria-hidden="true">
          <div
            className={styles.fill}
            style={{ width: `${(done / total) * 100}%`, background: `var(--theme-${stop.theme})` }}
          />
        </div>
        <span className={styles.count}>{t('quiz.progress', { n: index + 1, total })}</span>
      </div>

      {reward ? (
        <RewardCard
          ref={rewardRef}
          stop={stop}
          item={item}
          fresh={reward.fresh}
          grade={reward.grade}
        />
      ) : (
        <div className={styles.card}>
          <QuizQuestion
            ref={promptRef}
            prompt={question.prompt}
            sceneImage={stop.scene.image}
            stampIcon={stop.rewards.stamp.icon}
          />
          <p className={styles.pick}>{t(INSTRUCTION[question.type])}</p>
          <AnswerInput
            key={`${question.id}:${attempt}`}
            question={question}
            status={status}
            onAnswer={answer}
          />
          {status !== 'answering' && (
            <Feedback
              ref={feedbackRef}
              right={status === 'right'}
              explain={question.explain}
              source={source?.short ?? question.sourceId}
              hint={question.hint}
              hintOpen={hintOpen}
              onShowHint={() => setHintOpen(true)}
              actionLabel={
                status === 'wrong'
                  ? t('quiz.tryAgain')
                  : isLast
                    ? t('quiz.finish')
                    : t('quiz.nextQuestion')
              }
              onAction={status === 'wrong' ? tryAgain : next}
              xp={gained}
            />
          )}
        </div>
      )}
      {reaction && (status !== 'answering' || reward) && (
        <RizalReaction
          guide={guide}
          rizal={content.characters[guide.speaker]}
          reaction={reaction}
        />
      )}
    </div>
  );
}
