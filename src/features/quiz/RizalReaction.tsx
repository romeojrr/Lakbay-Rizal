import { useEffect, useState } from 'react';
import type { Character } from '../../content/schemas';
import type { Guide } from '../../content/schemas.v3';
import { cx } from '../../lib/cx';
import { useReducedMotion } from '../../lib/useReducedMotion';
import Portrait from '../../components/Portrait/Portrait';
import styles from './QuizPage.module.css';

export type ReactionKind = keyof Guide['reactions'];

export interface Reaction {
  kind: ReactionKind;
  /** Which line of that kind (streak: 0 = five in a row, 1 = ten). */
  index: number;
  /** Changes with each new reaction, so it pops in again. */
  key: number;
}

/** How long Rizal's bubble stays before it slips away. */
export const REACTION_MS = 5000;

/** A random line of a kind, but the streak lines are fixed: 5 → the first, 10 → the second. */
export function pickReaction(guide: Guide, kind: ReactionKind, streak?: number): number {
  if (kind === 'streak') return streak !== undefined && streak >= 10 ? 1 : 0;
  return Math.floor(Math.random() * guide.reactions[kind].length);
}

/**
 * SRS v2.3 §3.7: after an answer Rizal pops up in the corner with one line (correct, wrong, a
 * streak of 5 or 10, a perfect stop), like a speech bubble, then slips away after 5 s
 * (owner, 2026-11-26). It never covers the answers and never takes clicks. Only one at a time.
 */
export default function RizalReaction({
  guide,
  rizal,
  reaction,
}: {
  guide: Guide;
  rizal: Character | undefined;
  reaction: Reaction;
}) {
  const still = useReducedMotion();
  // The reaction whose time is up; a new reaction (a new key) shows again.
  const [hidden, setHidden] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setHidden(reaction.key), REACTION_MS);
    return () => window.clearTimeout(timer);
  }, [reaction.key]);
  const shown = hidden !== reaction.key;

  const lines = guide.reactions[reaction.kind];
  const line = lines[Math.min(reaction.index, lines.length - 1)];
  if (!line || !rizal?.portrait) return null;
  return (
    <div
      key={reaction.key}
      className={cx(styles.reaction, shown ? (still ? 'motion-fade' : styles.popIn) : styles.leave)}
      role="status"
    >
      <Portrait character={rizal} />
      <p className={styles.bubble}>{line.text}</p>
    </div>
  );
}
