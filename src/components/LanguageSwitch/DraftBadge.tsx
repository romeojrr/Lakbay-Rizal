import { useEffect, useId, useState } from 'react';
import { t } from '../../i18n/t';
import styles from './LanguageSwitch.module.css';

/**
 * §3.10: shown while the Filipino files have `status: "draft"`. The tooltip opens on hover,
 * on keyboard focus and on tap (for touch screens); Escape closes it.
 */
export default function DraftBadge({ wide = false }: { wide?: boolean }) {
  const tipId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span className={`${styles.badgeWrap} ${wide ? styles.wide : ''}`} data-draft-badge="">
      <button
        type="button"
        className={styles.badge}
        aria-label={t('lang.draft')}
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
      >
        <span className={styles.long} aria-hidden="true">
          {t('lang.draft')}
        </span>
        <span className={styles.short} aria-hidden="true">
          {t('lang.draftShort')}
        </span>
      </button>
      <span role="tooltip" id={tipId} className={styles.tip} data-open={open || undefined}>
        {t('lang.draftTip')}
      </span>
    </span>
  );
}
