import { useId, useState } from 'react';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './LineTag.module.css';

interface LineTagProps {
  /** The short title of the source the words are quoted from; absent = dramatized. */
  recordedFrom?: string;
}

/**
 * SRS v2.3 §3.6: every spoken line is tagged. Green "Recorded" = real words from a published
 * source; grey "Dramatized" = based on real events, imagined words. The tip shows on hover,
 * keyboard focus or a tap (touch browsers do not focus buttons), and is linked for screen readers.
 */
export default function LineTag({ recordedFrom }: LineTagProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const recorded = recordedFrom !== undefined;
  const tip = recorded
    ? t('stop.tipWithSource', {
        tip: t('stop.recordedTip'),
        source: t('stop.source', { title: recordedFrom }),
      })
    : t('stop.dramatizedTip');
  return (
    <span className={styles.wrap} data-guide="line-tag">
      <button
        type="button"
        className={cx(styles.tag, recorded ? styles.recorded : styles.dramatized)}
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
      >
        {recorded ? t('stop.recorded') : t('stop.dramatized')}
      </button>
      <span id={tipId} role="tooltip" className={cx(styles.tip, open && styles.open)}>
        {tip}
      </span>
    </span>
  );
}
