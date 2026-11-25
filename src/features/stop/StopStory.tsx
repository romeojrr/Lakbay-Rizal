import { useCallback, useEffect, useRef, useState } from 'react';
import BackLink from '../../components/BackLink/BackLink';
import InfoDrawer from '../../components/InfoDrawer/InfoDrawer';
import ReadMoreDialog from '../../components/ReadMoreDialog/ReadMoreDialog';
import SourceCard from '../../components/SourceCard/SourceCard';
import type { Content, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { useLanguage } from '../../i18n/useLanguage';
import { cx } from '../../lib/cx';
import { useSceneFit } from '../../lib/useSceneFit';
import { useProgress } from '../../store/progress';
import { chaptersReadAt, buildSteps } from '../story/steps';
import StoryPlayer from '../story/StoryPlayer';
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
 * Stop screen (SRS v2.3 §3.6, §5.5): the chapter story player on a whole-number-scaled scene,
 * text over its bottom (desktop) or under it (phones); This stop / Item / Sources in a drawer.
 */
export default function StopStory({ stop, content, isFinal }: StopStoryProps) {
  const story = stop;
  const [readMoreOpen, setReadMoreOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const fit = useSceneFit(stageRef, SCENE.w, SCENE.h, FRAME_CHROME);
  const visited = useProgress((s) => s.visited.includes(stop.id));
  const { visit, complete, markRead, markChaptersRead } = useProgress.getState();
  const lang = useLanguage();
  const finished = visited || atEnd;
  const hasQuiz = stop.quiz.length > 0;
  const closeInfo = useCallback(() => setInfoOpen(false), []);

  // GD-3: reaching the last step marks the stop visited (and read in this language, §3.10);
  // chapters read are counted (§3.8). GD-6: the final stop has no quiz; it completes quietly.
  const onProgress = useCallback(
    (index: number, total: number) => {
      markChaptersRead(stop.id, chaptersReadAt(buildSteps(story.chapters), index));
      const end = index === total - 1;
      setAtEnd(end);
      if (!end) return;
      visit(stop.id);
      markRead(stop.id, lang);
      if (isFinal && !hasQuiz) complete(stop, { quiet: true });
    },
    [stop, story.chapters, lang, isFinal, hasQuiz, visit, markRead, markChaptersRead, complete],
  );

  // §5.5: a phone held sideways shows the scene full-screen (the top bar scrolls away).
  useEffect(() => {
    if (fit.landscape) stageRef.current?.scrollIntoView?.({ block: 'start' });
  }, [fit.landscape]);

  // The builder stop's links (quiz and builder) are under the scene (§3.5).
  const endLink = stop.builder
    ? undefined
    : hasQuiz
      ? {
          to: `/stop/${stop.id}/quiz`,
          label: t('stop.takeQuizButton', { label: t('stop.takeQuiz') }),
        }
      : undefined;

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
        <StoryPlayer
          story={story}
          characters={content.characters}
          sources={content.sources}
          quiet={isFinal}
          endLink={endLink}
          width={fit.width}
          onProgress={onProgress}
          textClassName={styles.dialogue}
          overlay={fit.overlay}
        />
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
      <ReadMoreDialog
        stop={story}
        sources={content.sources}
        open={readMoreOpen}
        onClose={() => setReadMoreOpen(false)}
      />
    </div>
  );
}
