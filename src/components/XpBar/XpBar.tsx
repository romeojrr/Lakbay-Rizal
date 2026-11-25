import { t } from '../../i18n/t';
import styles from './XpBar.module.css';

/**
 * XP bar + rank slot (SRS v2.3 §3.8, §5.5). U1 placeholder: always 0 XP and no rank name;
 * real XP, streak and ranks from gamification.json arrive in U5.
 */
export default function XpBar() {
  return (
    <div className={styles.xp} data-guide="xp-bar">
      <span className={styles.label}>{t('xp.amount', { xp: 0, label: t('xp.label') })}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: '0%' }} />
      </span>
    </div>
  );
}
