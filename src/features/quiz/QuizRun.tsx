import { useEffect, useRef, useState } from 'react';
import BackLink from '../../components/BackLink/BackLink';
import Panel from '../../components/Panel/Panel';
import QuizQuestion from '../../components/QuizQuestion/QuizQuestion';
import RewardCard from '../../components/RewardCard/RewardCard';
import type { Content, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { shuffle } from '../../lib/shuffle';
import { useProgress } from '../../store/progress';
import styles from './QuizPage.module.css';

type Question = PlayableStop['quiz'][number];

/** FR-44: question order and option order are shuffled for each attempt. */
const shuffled = (questions: readonly Question[]) =>
  shuffle(questions).map((q) => ({ ...q, options: shuffle(q.options) }));

interface QuizRunProps {
  stop: PlayableStop;
  content: Content;
}

/** One question at a time; wrong answers show the hint and can be retried (FR-40 to FR-43). */
export default function QuizRun({ stop, content }: QuizRunProps) {
  const complete = useProgress((s) => s.complete);
  const [questions, setQuestions] = useState(() => shuffled(stop.quiz));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [reward, setReward] = useState<{ fresh: boolean } | null>(null);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const feedbackRef = useRef<HTMLHeadingElement>(null);
  const rewardRef = useRef<HTMLHeadingElement>(null);
  const previous = useRef({ index, picked, reward });

  const question = questions[index];
  const total = questions.length;
  const isRight = question !== undefined && picked === question.answer;
  const isLast = index === total - 1;

  // Move focus to whatever just changed, so keyboard and screen-reader users follow along.
  // Only on a real change (not on mount, which React may run twice).
  useEffect(() => {
    const before = previous.current;
    previous.current = { index, picked, reward };
    if (before.index === index && before.picked === picked && before.reward === reward) return;
    if (reward) rewardRef.current?.focus();
    else if (picked) feedbackRef.current?.focus();
    else promptRef.current?.focus();
  }, [index, picked, reward]);

  if (!question) return null;

  const tryAgain = () => {
    // GD-5 / FR-42: no penalty; the same question comes back with its options reshuffled.
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, options: shuffle(q.options) } : q)),
    );
    setPicked(null);
  };

  const next = () => {
    if (!isLast) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    // FR-43: the progress store is updated exactly once.
    setReward({ fresh: complete(stop) });
  };

  const progress = ((index + (isRight || reward ? 1 : 0)) / total) * 100;
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
            style={{ width: `${progress}%`, background: `var(--theme-${stop.theme})` }}
          />
        </div>
        <span className={styles.count}>{t('quiz.progress', { n: index + 1, total })}</span>
      </div>

      {reward ? (
        <RewardCard ref={rewardRef} stop={stop} item={item} fresh={reward.fresh} />
      ) : (
        <>
          <QuizQuestion
            ref={promptRef}
            question={question}
            picked={picked}
            sceneImage={stop.scene.image}
            stampIcon={stop.rewards.stamp.icon}
            onPick={setPicked}
          />
          {picked === null ? (
            <p className={styles.pick}>{t('quiz.pick')}</p>
          ) : (
            <Panel className={styles.feedback}>
              <h2
                ref={feedbackRef}
                tabIndex={-1}
                className={isRight ? styles.correct : styles.wrong}
              >
                {isRight ? t('quiz.correct') : t('quiz.wrong')}
              </h2>
              {!isRight && <p className={styles.hint}>{t('quiz.hint', { hint: question.hint })}</p>}
              <button type="button" className={styles.action} onClick={isRight ? next : tryAgain}>
                {!isRight ? t('quiz.tryAgain') : isLast ? t('quiz.finish') : t('quiz.nextQuestion')}
              </button>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
