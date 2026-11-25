import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackLink from '../../components/BackLink/BackLink';
import DialogueBox from '../../components/DialogueBox/DialogueBox';
import Panel from '../../components/Panel/Panel';
import ReadMoreDialog from '../../components/ReadMoreDialog/ReadMoreDialog';
import SceneView from '../../components/SceneView/SceneView';
import SourceCard from '../../components/SourceCard/SourceCard';
import type { Content, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import StopFacts from './StopFacts';
import styles from './StopPage.module.css';

interface StopStoryProps {
  stop: PlayableStop;
  content: Content;
  isFinal: boolean;
}

/** Scene + dialogue on the left, facts, sources and actions on the right (Story.dc.html). */
export default function StopStory({ stop, content, isFinal }: StopStoryProps) {
  const [index, setIndex] = useState(0);
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  const visited = useProgress((s) => s.visited.includes(stop.id));
  const visit = useProgress((s) => s.visit);
  const lines = stop.dialogue.lines;
  const lastIndex = lines.length - 1;
  const finished = visited || index === lastIndex;
  const hasQuiz = stop.quiz.length > 0;

  // GD-3: reaching the last line marks the stop visited.
  useEffect(() => {
    if (index === lastIndex) visit(stop.id);
  }, [index, lastIndex, stop.id, visit]);

  const next = () => setIndex(index < lastIndex ? index + 1 : 0);

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <BackLink fallback={`/region/${stop.region}`} label={t('stop.backToMap')} />
      </div>
      <section className={styles.story} aria-label={t('stop.story')}>
        <SceneView stop={stop} speaker={lines[index]?.speaker} />
        <DialogueBox stop={stop} characters={content.characters} index={index} onNext={next} />
      </section>
      <aside className={styles.aside}>
        <StopFacts
          stop={stop}
          item={stop.rewards.item ? content.items[stop.rewards.item] : undefined}
        />
        <SourceCard refs={stop.sources} sources={content.sources} />
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={() => setReadMoreOpen(true)}>
            {t('stop.readMore')}
          </button>
          {hasQuiz &&
            (finished ? (
              <Link className={styles.primary} to={`/stop/${stop.id}/quiz`}>
                {t('stop.quiz')}
              </Link>
            ) : (
              <span className={styles.disabled} aria-disabled="true">
                {t('stop.quiz')}
                <span className="visually-hidden"> {t('stop.quizLockedHint')}</span>
              </span>
            ))}
        </div>
        {!hasQuiz && isFinal && finished && (
          // GD-6: a quiet close, no quiz and no celebration.
          <Panel className={styles.epilogue} aria-labelledby="epilogue-title">
            <h2 id="epilogue-title" className={styles.cardTitle}>
              {t('stop.epilogueTitle')}
            </h2>
            <p className={styles.epilogueText}>{t('stop.epilogueBody')}</p>
            <div className={styles.epilogueLinks}>
              <Link to={`/region/${stop.region}`}>{t('stop.epilogueTimeline')}</Link>
              <Link to="/credits">{t('stop.epilogueCredits')}</Link>
            </div>
          </Panel>
        )}
      </aside>
      <ReadMoreDialog stop={stop} open={readMoreOpen} onClose={() => setReadMoreOpen(false)} />
    </div>
  );
}
