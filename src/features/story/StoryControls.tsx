import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './StoryPanel.module.css';

interface StoryControlsProps {
  chapter: number;
  chapters: number;
  atStart: boolean;
  atEnd: boolean;
  /** Where the story leads when it ends ("Take the quiz ▶"), if anywhere. */
  endLink?: { to: string; label: string };
  onNext: () => void;
  onBack: () => void;
  onReplay: () => void;
}

/** §3.6: chapter progress and Back / Next (no auto-play or skip: owner, 2026-11-26). */
export default function StoryControls(props: StoryControlsProps) {
  const { chapter, chapters, atStart, atEnd, endLink } = props;
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
