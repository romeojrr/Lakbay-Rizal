import { useEffect } from 'react';
import { useRootData } from '../../app/useRootData';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useUi } from '../../store/ui';
import styles from './Celebrations.module.css';

const SHOW_MS = 4500;

/**
 * SRS v2.3 §3.8, §5.6: an achievement toast slides in from the top right; a rank-up banner
 * unrolls under the top bar. One at a time, each for a few seconds (or until closed).
 */
export default function Celebrations() {
  const { content, gamification } = useRootData();
  const current = useUi((s) => s.celebrations[0]);
  const dismiss = useUi((s) => s.dismissCelebration);
  const still = useReducedMotion();

  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(dismiss, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [current, dismiss]);

  let body: React.ReactNode = null;
  if (current?.kind === 'achievement') {
    const achievement = gamification.achievements.find((a) => a.id === current.id);
    const icon = achievement?.icon ? content.items[achievement.icon]?.icon : undefined;
    if (achievement) {
      body = (
        <div className={`${styles.toast} ${still ? 'motion-fade' : styles.slide}`}>
          {icon && <img className="pix" src={asset(icon)} alt="" width={52} height={52} />}
          <p className={styles.text}>
            <span className={styles.kicker}>{t('ach.unlocked')}</span>
            <span>{achievement.title}</span>
          </p>
          <button type="button" className={styles.close} onClick={dismiss}>
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">{t('celebrate.close')}</span>
          </button>
        </div>
      );
    }
  } else if (current?.kind === 'rank') {
    const rank = gamification.ranks.find((r) => r.id === current.id);
    if (rank) {
      body = (
        <div className={`${styles.banner} ${still ? 'motion-fade' : styles.unroll}`}>
          <p className={styles.text}>
            <span className={styles.kicker}>{t('rank.up', { rank: rank.title })}</span>
            <span>{rank.meaning}</span>
          </p>
          <button type="button" className={styles.close} onClick={dismiss}>
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">{t('celebrate.close')}</span>
          </button>
        </div>
      );
    }
  }

  return (
    <div className={styles.layer} aria-live="polite">
      {body}
    </div>
  );
}
