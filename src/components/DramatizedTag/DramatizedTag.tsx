import { useState } from 'react';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './DramatizedTag.module.css';

/**
 * "Dramatized" tag with its explanation (SRS §3.6, FR-35). The tip shows on hover, keyboard
 * focus, or a tap (touch browsers do not focus buttons), and is linked for screen readers.
 */
export default function DramatizedTag() {
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={styles.tag}
        aria-describedby="dramatized-tip"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        {t('stop.dramatized')}
      </button>
      <span id="dramatized-tip" role="tooltip" className={cx(styles.tip, open && styles.open)}>
        {t('stop.dramatizedTip')}
      </span>
    </span>
  );
}
