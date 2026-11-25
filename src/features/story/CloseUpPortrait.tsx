import { useEffect, useState, type CSSProperties } from 'react';
import { MOODS } from '../../content/constants';
import type { Mood } from '../../content/schemas.v3';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import styles from './CloseUpPortrait.module.css';

interface CloseUpPortraitProps {
  sheet: string;
  name: string;
  mood: Mood;
  /** Plays the talk frames (columns 2 and 3) while the line is typing. */
  talking: boolean;
  /** Reduced motion: no talk or blink frames, and a fade instead of the slide. */
  still: boolean;
}

const BLINK_MS = 120;

/**
 * SRS v2.3 §3.6, §7.10: a 64 px frame from the speaker's 4 × 6 sheet at a whole-number scale
 * (CSS picks 2× or 1×). Columns: idle, blink, talk, talk; the row is the line's mood.
 */
export default function CloseUpPortrait({
  sheet,
  name,
  mood,
  talking,
  still,
}: CloseUpPortraitProps) {
  const [blinking, setBlinking] = useState(false);

  // Rests on the idle frame and blinks every 3–6 s.
  useEffect(() => {
    if (talking || still) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setBlinking(true);
          timer = window.setTimeout(() => {
            setBlinking(false);
            schedule();
          }, BLINK_MS);
        },
        3000 + Math.random() * 3000,
      );
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      setBlinking(false);
    };
  }, [talking, still]);

  const style = {
    '--sheet': `url("${asset(sheet)}")`,
    '--row': MOODS.indexOf(mood),
    '--col': blinking ? 1 : 0,
  } as CSSProperties;

  return (
    <div className={cx(styles.frame, still ? 'motion-fade' : styles.slide)}>
      <div
        role="img"
        aria-label={t('a11y.portrait', { name, mood: t(`mood.${mood}`) })}
        className={cx('pix', styles.portrait, talking && !still && styles.talking)}
        style={style}
        data-frame={talking && !still ? 'talk' : blinking ? 'blink' : 'idle'}
      />
    </div>
  );
}
