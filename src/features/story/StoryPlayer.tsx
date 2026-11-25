import { useEffect, useMemo, useRef, useState } from 'react';
import { AMBIENT } from '../../components/SceneView/Ambient';
import SceneView from '../../components/SceneView/SceneView';
import type { Character, PlayableStop, Source } from '../../content/schemas';
import { t } from '../../i18n/t';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useUi } from '../../store/ui';
import { buildSteps, stepText, types } from './steps';
import StoryControls from './StoryControls';
import StoryPanel from './StoryPanel';
import { useStoryKeys } from './useStoryKeys';
import { useTypewriter } from './useTypewriter';
import styles from './StoryPanel.module.css';
import { play } from '../../lib/sound';

/** §3.6: about 40 characters a second; slower and quieter on the final stop (GD-6). */
const CPS = 40;
const QUIET_CPS = 25;
/** Auto-play moves on this long after a step has finished typing. */
export const AUTOPLAY_DELAY = 1500;

interface StoryPlayerProps {
  story: PlayableStop;
  characters: Record<string, Character>;
  sources: Source[];
  /** GD-6: the final stop (no close-ups, no auto-play, slower text). */
  quiet: boolean;
  endLink?: { to: string; label: string };
  /** The scene's width in px (whole-number scale, §5.5). */
  width: number | undefined;
  /** Called with the step index and the number of steps whenever the step changes. */
  onProgress: (index: number, total: number) => void;
  textClassName?: string;
  /** The text box sits over the bottom of the scene (wide screens, §5.5). */
  overlay?: boolean;
}

/** SRS v2.3 §3.6: the chapter-based story player over (or under) the scene. */
export default function StoryPlayer(props: StoryPlayerProps) {
  const { story, characters, sources, quiet, endLink, width, onProgress } = props;
  const steps = useMemo(() => buildSteps(story.chapters), [story.chapters]);
  const last = steps.length - 1;
  const saved = useUi((s) => s.storyStep[story.id] ?? 0);
  const setStoryStep = useUi((s) => s.setStoryStep);
  const index = Math.min(Math.max(saved, 0), last);
  const step = steps[index] ?? { kind: 'title', chapter: 0 };
  const still = useReducedMotion();
  const [autoplay, setAutoplay] = useState(false);
  const text = stepText(story, step);
  const stepKey = `${story.id}:${index}`;
  // Steps already passed (going Back) show their text at once.
  const [furthest, setFurthest] = useState(index);
  const instant = still || !types(step) || index < furthest;
  const typer = useTypewriter(text, stepKey, quiet ? QUIET_CPS : CPS, instant);
  const atEnd = index === last;

  const go = (to: number) => {
    const target = Math.min(Math.max(to, 0), last);
    setFurthest((value) => Math.max(value, index, target === last ? last : 0));
    setStoryStep(story.id, target);
  };
  // The first press shows the whole text; the next one moves on.
  const next = () => {
    if (!typer.done) typer.finish();
    else if (!atEnd) go(index + 1);
  };
  const back = () => go(index - 1);
  const toggleAutoplay = quiet ? undefined : () => setAutoplay((on) => !on);
  useStoryKeys({ next, back, toggleAutoplay });

  useEffect(() => onProgress(index, steps.length), [index, steps.length, onProgress]);

  // §3.11: a page turn for each step, a typewriter tick every 3rd character.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    play('page');
  }, [index]);
  useEffect(() => {
    if (!typer.done && typer.shown > 0 && typer.shown % 3 === 0) play('tick');
  }, [typer.shown, typer.done]);

  // Auto-play: the next step 1.5 s after this one has finished typing.
  useEffect(() => {
    if (!autoplay || quiet || !typer.done || atEnd) return;
    const timer = window.setTimeout(() => {
      setFurthest((value) => Math.max(value, index));
      setStoryStep(story.id, index + 1);
    }, AUTOPLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, [autoplay, quiet, typer.done, atEnd, index, story.id, setStoryStep]);

  const chapter = story.chapters[step.chapter];
  const line = step.kind === 'line' ? chapter?.lines[step.line] : undefined;
  const bubbleAt = line?.onScene && !quiet ? story.scene.speakerAnchors?.[line.speaker] : undefined;

  return (
    <section className={styles.player} style={{ width }} aria-label={t('stop.story')}>
      <SceneView
        scene={story.scene}
        place={story.place.label}
        year={story.year}
        bubbleAt={bubbleAt}
        bubbleKey={stepKey}
        still={still}
        covered={props.overlay}
        ambient={quiet ? undefined : AMBIENT[story.id]}
      />
      <div className={props.textClassName}>
        <div className={styles.box}>
          <StoryPanel
            story={story}
            step={step}
            stepKey={stepKey}
            shown={typer.shown}
            typing={!typer.done}
            still={still}
            quiet={quiet}
            characters={characters}
            sources={sources}
          />
          <StoryControls
            chapter={step.chapter + 1}
            chapters={story.chapters.length}
            atStart={index === 0}
            atEnd={atEnd}
            quiet={quiet}
            autoplay={autoplay}
            endLink={endLink}
            onNext={next}
            onBack={back}
            onSkip={() => go(last)}
            onReplay={() => {
              setFurthest(0);
              setStoryStep(story.id, 0);
            }}
            onToggleAutoplay={() => toggleAutoplay?.()}
          />
          <p className="visually-hidden">{t('stop.playerHelp')}</p>
        </div>
      </div>
    </section>
  );
}
