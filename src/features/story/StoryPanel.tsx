import { useEffect, useRef } from 'react';
import type { Character, Source } from '../../content/schemas';
import type { StopV3 } from '../../content/schemas.v3';
import { t } from '../../i18n/t';
import LineTag from '../../components/LineTag/LineTag';
import Portrait from '../../components/Portrait/Portrait';
import FactCard from './FactCard';
import { stepText, type Step } from './steps';
import styles from './StoryPanel.module.css';

interface StoryPanelProps {
  story: StopV3;
  step: Step;
  /** Changes with every step, so focus moves to the new text. */
  stepKey: string;
  shown: number;
  typing: boolean;
  still: boolean;
  /** GD-6: the final stop shows no close-ups; the narrator speaks. */
  quiet: boolean;
  characters: Record<string, Character>;
  sources: Source[];
}

/** Typed text: the part not shown yet keeps its space, so the box does not grow as it types. */
function Typed({ text, shown }: { text: string; shown: number }) {
  return (
    <>
      <span aria-hidden="true">{text.slice(0, shown)}</span>
      <span aria-hidden="true" className={styles.unshown}>
        {text.slice(shown)}
      </span>
      <span className="visually-hidden">{text}</span>
    </>
  );
}

/** SRS v2.3 §3.6: the parchment box with the current step: title card, narration, line or fact. */
export default function StoryPanel(props: StoryPanelProps) {
  const { story, step, stepKey, shown, still, characters, sources } = props;
  const textRef = useRef<HTMLDivElement>(null);
  const previousKey = useRef(stepKey);
  const chapter = story.chapters[step.chapter];
  const text = stepText(story, step);
  const shortTitle = (id: string) => sources.find((s) => s.id === id)?.short ?? id;

  // Screen readers hear each new step: focus moves to its text (not on first render).
  useEffect(() => {
    if (previousKey.current === stepKey) return;
    previousKey.current = stepKey;
    textRef.current?.focus({ preventScroll: true });
  }, [stepKey]);

  let body: React.ReactNode;
  if (step.kind === 'title') {
    body = (
      <div className={styles.titleCard}>
        <p className={styles.kicker}>
          {t('stop.chapter', { n: step.chapter + 1, total: story.chapters.length })}
        </p>
        <h2 className={`${styles.chapterTitle} ${still ? 'motion-fade' : styles.draw}`}>{text}</h2>
      </div>
    );
  } else if (step.kind === 'fact' && chapter?.fact) {
    body = <FactCard text={text} source={shortTitle(chapter.fact.sourceId)} />;
  } else if (step.kind === 'line') {
    const line = chapter?.lines[step.line];
    const character = line ? characters[line.speaker] : undefined;
    const isNarrator = line?.speaker === 'narrator';
    body = (
      <div className={styles.line}>
        <Portrait character={character} />
        <div className={styles.lineBody}>
          <p className={styles.speaker}>{character?.name ?? line?.speaker}</p>
          <p className={styles.text}>
            <Typed text={text} shown={shown} />
          </p>
          {!isNarrator && line && (
            <LineTag
              recordedFrom={line.recorded ? shortTitle(line.recorded.sourceId) : undefined}
            />
          )}
        </div>
      </div>
    );
  } else {
    body = (
      <p className={styles.text}>
        <Typed text={text} shown={shown} />
      </p>
    );
  }

  return (
    <div ref={textRef} tabIndex={-1} className={styles.panel} data-step={step.kind}>
      {body}
    </div>
  );
}
