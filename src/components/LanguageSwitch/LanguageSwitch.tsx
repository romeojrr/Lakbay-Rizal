import { t } from '../../i18n/t';
import styles from './LanguageSwitch.module.css';

/**
 * Language switch slot (SRS v2.3 §3.10). U1 shows the current language only; the EN | FIL
 * switch with fallback and the "Draft translation" badge arrives in U2.
 */
export default function LanguageSwitch() {
  return (
    <span className={styles.slot}>
      <span aria-hidden="true">{t('lang.short')}</span>
      <span className="visually-hidden">{t('lang.current')}</span>
    </span>
  );
}
