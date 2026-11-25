import { useEffect, useRef } from 'react';
import type { Character, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import Portrait from '../Portrait/Portrait';
import styles from './DialogueBox.module.css';

interface DialogueBoxProps {
  stop: PlayableStop;
  characters: Record<string, Character>;
  index: number;
  onNext: () => void;
}

/** RPG-style dialogue: portrait, name, one line at a time, progress dots, Next (SRS §3.6, FR-31). */
export default function DialogueBox({ stop, characters, index, onNext }: DialogueBoxProps) {
  const lines = stop.dialogue.lines;
  const line = lines[index];
  const last = index === lines.length - 1;
  const textRef = useRef<HTMLParagraphElement>(null);
  const firstRender = useRef(true);

  // Keep keyboard focus useful: after Replay, move focus to the first line's text.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (index === 0) textRef.current?.focus();
  }, [index]);

  if (!line) return null;
  const character = characters[line.speaker];
  const name = character?.name ?? line.speaker;

  return (
    <section className={styles.box} aria-label={t('stop.dialogue')}>
      <Portrait key={line.speaker} character={character} />
      <div className={styles.body}>
        <span className={styles.speaker}>{name}</span>
        <p ref={textRef} className={styles.text} tabIndex={-1} aria-live="polite">
          {line.text}
        </p>
        <div className={styles.footer}>
          <div className={styles.dots} aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i} className={cx(styles.dot, i <= index && styles.seen)} />
            ))}
          </div>
          <span className="visually-hidden">
            {t('stop.lineOf', { n: index + 1, total: lines.length })}
          </span>
          <button type="button" className={styles.next} onClick={onNext}>
            {last ? t('stop.replay') : t('stop.next')}
          </button>
        </div>
      </div>
    </section>
  );
}
