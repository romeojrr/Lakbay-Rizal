import type { Theme } from '../../content/schemas';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './ThemeBadge.module.css';

interface ThemeBadgeProps {
  theme: Theme;
  done: number;
  total: number;
}

/** Progress for one theme, e.g. "Study 6/7"; lights up when every stop is done (FR-52). */
export default function ThemeBadge({ theme, done, total }: ThemeBadgeProps) {
  const complete = total > 0 && done === total;
  return (
    <li className={cx(styles.badge, complete && styles.complete)}>
      <span
        className={styles.swatch}
        style={{ background: `var(--theme-${theme})` }}
        aria-hidden="true"
      >
        {complete ? '★' : ''}
      </span>
      <span className={styles.name}>{t(`themes.${theme}`)}</span>
      <span className={styles.count}>
        {t('passport.badgeCount', { done, total })}
        {complete && <span className="visually-hidden">, {t('passport.badgeComplete')}</span>}
      </span>
    </li>
  );
}
