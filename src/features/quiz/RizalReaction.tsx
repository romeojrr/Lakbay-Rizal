import type { Character } from '../../content/schemas';
import type { Guide } from '../../content/schemas.v3';
import { useReducedMotion } from '../../lib/useReducedMotion';
import Portrait from '../../components/Portrait/Portrait';
import styles from './QuizPage.module.css';

export type ReactionKind = keyof Guide['reactions'];

export interface Reaction {
  kind: ReactionKind;
  /** Which line of that kind (streak: 0 = five in a row, 1 = ten). */
  index: number;
  /** Changes with each new reaction, so it animates in again. */
  key: number;
}

/** A random line of a kind, but the streak lines are fixed: 5 → the first, 10 → the second. */
export function pickReaction(guide: Guide, kind: ReactionKind, streak?: number): number {
  if (kind === 'streak') return streak !== undefined && streak >= 10 ? 1 : 0;
  return Math.floor(Math.random() * guide.reactions[kind].length);
}

/**
 * SRS v2.3 §3.7: Rizal's small portrait by the question card with one line after each answer
 * (correct, wrong, a streak of 5 or 10, a perfect stop). Only one bubble is ever shown.
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
  const lines = guide.reactions[reaction.kind];
  const line = lines[Math.min(reaction.index, lines.length - 1)];
  if (!line || !rizal?.portrait) return null;
  return (
    <div className={styles.reaction} key={reaction.key}>
      <Portrait character={rizal} />
      <p className={`${styles.bubble} ${still ? 'motion-fade' : styles.pop}`}>{line.text}</p>
    </div>
  );
}
