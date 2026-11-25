import { useCallback, useEffect, useRef, useState } from 'react';
import BackLink from '../../components/BackLink/BackLink';
import DialogueBox from '../../components/DialogueBox/DialogueBox';
import InfoDrawer from '../../components/InfoDrawer/InfoDrawer';
import ReadMoreDialog from '../../components/ReadMoreDialog/ReadMoreDialog';
import SceneView from '../../components/SceneView/SceneView';
import SourceCard from '../../components/SourceCard/SourceCard';
import type { Content, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { useLanguage } from '../../i18n/useLanguage';
import { cx } from '../../lib/cx';
import { useSceneFit } from '../../lib/useSceneFit';
import { useProgress } from '../../store/progress';
import StopActions from './StopActions';
import StopFacts from './StopFacts';
import styles from './StopPage.module.css';

const SCENE = { w: 384, h: 216 };
/** WoodFrame (8 px padding + 3 px border) and the scene's own 3 px border, on both sides. */
const FRAME_CHROME = 28;

interface StopStoryProps {
  stop: PlayableStop;
  content: Content;
  isFinal: boolean;
}

/**
 * Stop screen (SRS v2.3 §5.5): a full-width, whole-number-scaled scene with the dialogue over
 * its bottom (desktop) or under it (phones); This stop / Item / Sources in an Info drawer.
 */
export default function StopStory({ stop, content, isFinal }: StopStoryProps) {
  const [index, setIndex] = useState(0);
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const fit = useSceneFit(stageRef, SCENE.w, SCENE.h, FRAME_CHROME);
  const visited = useProgress((s) => s.visited.includes(stop.id));
  const visit = useProgress((s) => s.visit);
  const complete = useProgress((s) => s.complete);
  const markRead = useProgress((s) => s.markRead);
  const lang = useLanguage();
  const lines = stop.dialogue.lines;
  const lastIndex = lines.length - 1;
  const finished = visited || index === lastIndex;
  const hasQuiz = stop.quiz.length > 0;
  const closeInfo = useCallback(() => setInfoOpen(false), []);

  // GD-3: reaching the last line marks the stop visited (and read in this language, §3.10).
  // GD-6: the final stop has no quiz; finishing its dialogue completes it quietly.
  useEffect(() => {
    if (index !== lastIndex) return;
    visit(stop.id);
    markRead(stop.id, lang);
    if (isFinal && !hasQuiz) complete(stop, { quiet: true });
  }, [index, lastIndex, stop, visit, markRead, lang, complete, isFinal, hasQuiz]);

  // §5.5: a phone held sideways shows the scene full-screen (the top bar scrolls away).
  useEffect(() => {
    if (fit.landscape) stageRef.current?.scrollIntoView?.({ block: 'start' });
  }, [fit.landscape]);

  const next = () => setIndex(index < lastIndex ? index + 1 : 0);

  return (
    <div className={cx(styles.screen, infoOpen && styles.infoOpen)}>
      <div className={styles.toolbar}>
        <BackLink fallback={`/region/${stop.region}`} label={t('stop.backToMap')} />
        {/* Phones: switch between the story and the info cards under the scene. */}
        <div className={styles.views} role="group" aria-label={t('stop.view')}>
          <button type="button" aria-pressed={!infoOpen} onClick={closeInfo}>
            {t('stop.story')}
          </button>
          <button type="button" aria-pressed={infoOpen} onClick={() => setInfoOpen(true)}>
            {t('stop.info')}
          </button>
        </div>
        {/* Desktop: open the Info drawer over the scene. */}
        <button
          type="button"
          className={styles.infoToggle}
          aria-expanded={infoOpen}
          aria-controls="stop-info"
          onClick={() => setInfoOpen(!infoOpen)}
        >
          {t('stop.info')}
        </button>
      </div>
      <div ref={stageRef} className={cx(styles.stage, fit.overlay && styles.overlay)}>
        <section
          className={styles.sceneBox}
          style={{ width: fit.width }}
          aria-label={t('stop.story')}
        >
          <SceneView stop={stop} speaker={lines[index]?.speaker} />
          <div className={styles.dialogue}>
            <DialogueBox stop={stop} characters={content.characters} index={index} onNext={next} />
          </div>
        </section>
        <InfoDrawer id="stop-info" open={infoOpen} onClose={closeInfo}>
          <StopFacts
            stop={stop}
            item={stop.rewards.item ? content.items[stop.rewards.item] : undefined}
          />
          <SourceCard refs={stop.sources} sources={content.sources} />
        </InfoDrawer>
      </div>
      <StopActions
        stop={stop}
        finished={finished}
        isFinal={isFinal}
        onReadMore={() => setReadMoreOpen(true)}
      />
      <ReadMoreDialog stop={stop} open={readMoreOpen} onClose={() => setReadMoreOpen(false)} />
    </div>
  );
}
