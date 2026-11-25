import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './StoryPanel.module.css';

interface StoryControlsProps {
  chapter: number;
  chapters: number;
  atStart: boolean;
  atEnd: boolean;
  /** GD-6: no auto-play on the final stop. */
  quiet: boolean;
  autoplay: boolean;
  /** Where the story leads when it ends ("Take the quiz ▶"), if anywhere. */
  endLink?: { to: string; label: string };
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onReplay: () => void;
  onToggleAutoplay: () => void;
}

/** §3.6: chapter progress, Back / Next, Auto-play and Skip to the end. */
export default function StoryControls(props: StoryControlsProps) {
  const { chapter, chapters, atStart, atEnd, quiet, autoplay, endLink } = props;
  return (
    <div className={styles.controls}>
      <div className={styles.progress}>
        <span className={styles.chapterLabel}>
          {t('stop.chapter', { n: chapter, total: chapters })}
        </span>
        <span className={styles.bar} aria-hidden="true">
          {Array.from({ length: chapters }, (_, i) => (
            <span
              key={i}
              className={cx(
                styles.segment,
                i < chapter - 1 && styles.read,
                i === chapter - 1 && styles.current,
              )}
            />
          ))}
        </span>
      </div>
      <div className={styles.buttons}>
        {!quiet && (
          <button
            type="button"
            className={styles.secondary}
            aria-pressed={autoplay}
            onClick={props.onToggleAutoplay}
          >
            {t('stop.autoplay')}
          </button>
        )}
        {!atEnd && (
          <button type="button" className={styles.secondary} onClick={props.onSkip}>
            {t('stop.skip')}
          </button>
        )}
        <button
          type="button"
          className={styles.secondary}
          disabled={atStart}
          onClick={props.onBack}
        >
          {t('stop.prevButton', { label: t('stop.prev') })}
        </button>
        {atEnd ? (
          <>
            <button type="button" className={styles.secondary} onClick={props.onReplay}>
              {t('stop.replayButton', { label: t('stop.replay') })}
            </button>
            {endLink && (
              <Link className={styles.next} to={endLink.to}>
                {endLink.label}
              </Link>
            )}
          </>
        ) : (
          <button type="button" className={styles.next} onClick={props.onNext}>
            {t('stop.nextButton', { label: t('stop.next') })}
          </button>
        )}
      </div>
    </div>
  );
}
