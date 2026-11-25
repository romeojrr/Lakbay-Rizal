import { useRootData } from '../../app/useRootData';
import { nextRank, rankFor } from '../../game/rules';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import { useCountUp } from '../../lib/useCountUp';
import { useProgress } from '../../store/progress';
import styles from './XpBar.module.css';

/** A 10 × 12 pixel flame (decorative); it grows with the streak. */
function Flame({ size }: { size: number }) {
  return (
    <svg
      className={styles.flame}
      viewBox="0 0 10 12"
      width={10 * size}
      height={12 * size}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M4 0h2v2h1v2h1v2h1v4H8v1H7v1H3v-1H2v-1H1V6h1V4h1V2h1z" fill="var(--accent)" />
      <path d="M4 6h2v1h1v3H6v1H4v-1H3V7h1z" fill="var(--gold)" />
    </svg>
  );
}

/**
 * Top bar XP, rank and streak (SRS v2.3 §3.8, §5.5): "{xp} XP", the bar fills towards the next
 * rank, the rank title, and a flame meter for the streak of first-try answers.
 */
export default function XpBar() {
  const { gamification } = useRootData();
  const xp = useProgress((s) => s.xp);
  const shown = useCountUp(xp);
  const streak = useProgress((s) => s.streak);
  const rank = rankFor(xp, gamification.ranks);
  const next = nextRank(xp, gamification.ranks);
  const percent = next ? ((xp - rank.minXp) / (next.minXp - rank.minXp)) * 100 : 100;
  const flameSize = streak >= 10 ? 3 : streak >= 5 ? 2 : 1;

  return (
    <div className={styles.xp} data-guide="xp-bar">
      <span className={styles.rank}>{rank.title}</span>
      <span className={styles.label}>{t('xp.amount', { xp: shown, label: t('xp.label') })}</span>
      <span
        className={styles.track}
        role="progressbar"
        aria-label={next ? t('xp.toRank', { rank: next.title }) : t('rank.label')}
        aria-valuemin={rank.minXp}
        aria-valuemax={next?.minXp ?? xp}
        aria-valuenow={xp}
      >
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </span>
      <span className={cx(styles.streak, streak === 0 && styles.cold)}>
        <Flame size={flameSize} />
        <span aria-hidden="true">{streak}</span>
        <span className="visually-hidden">{t('quiz.streak', { n: streak })}</span>
      </span>
    </div>
  );
}
