import type { Content } from '../../content/schemas';
import type { Gamification } from '../../content/schemas.v3';
import { nextRank, rankFor } from '../../game/rules';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import styles from './PassportPage.module.css';

/** §3.8: the 14 badges with their item icons; locked ones are dimmed with "?". */
export function AchievementsPanel({
  gamification,
  content,
  unlocked,
}: {
  gamification: Gamification;
  content: Content;
  unlocked: readonly string[];
}) {
  const done = gamification.achievements.filter((a) => unlocked.includes(a.id)).length;
  return (
    <>
      <p className={styles.meta}>
        {t('passport.achievementsCount', { done, total: gamification.achievements.length })}
      </p>
      <ul className={styles.achievements}>
        {gamification.achievements.map((achievement) => {
          const has = unlocked.includes(achievement.id);
          const icon = achievement.icon ? content.items[achievement.icon]?.icon : undefined;
          return (
            <li key={achievement.id} className={cx(styles.achievement, !has && styles.lockedBadge)}>
              <span className={styles.badgeIcon} aria-hidden="true">
                {has && icon ? (
                  <img className="pix" src={asset(icon)} alt="" width={52} height={52} />
                ) : (
                  '?'
                )}
              </span>
              <span className={styles.badgeText}>
                <span className={styles.badgeTitle}>{achievement.title}</span>
                <span className={styles.badgeDesc}>{achievement.desc}</span>
                {!has && <span className="visually-hidden">, {t('passport.locked')}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** §3.8: the current rank, XP, how far to the next, and every rank with its meaning. */
export function RankPanel({ gamification, xp }: { gamification: Gamification; xp: number }) {
  const rank = rankFor(xp, gamification.ranks);
  const next = nextRank(xp, gamification.ranks);
  return (
    <>
      <div className={styles.rankNow}>
        <p className={styles.meta}>{t('passport.rankNow')}</p>
        <p className={styles.rankTitle}>{rank.title}</p>
        <p className={styles.meta}>{rank.meaning}</p>
        <p>{t('passport.xpTotal', { xp })}</p>
        <p className={styles.meta}>
          {next
            ? t('passport.toNext', { n: next.minXp - xp, rank: next.title })
            : t('passport.topRank')}
        </p>
      </div>
      <ol className={styles.ranks}>
        {gamification.ranks.map((r) => (
          <li key={r.id} className={cx(styles.rankRow, xp >= r.minXp && styles.rankReached)}>
            <span className={styles.badgeTitle}>{r.title}</span>
            <span className={styles.badgeDesc}>
              {r.meaning} · {t('passport.rankAt', { xp: r.minXp })}
            </span>
            {xp >= r.minXp && (
              <span className="visually-hidden">, {t('passport.rankReached')}</span>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
