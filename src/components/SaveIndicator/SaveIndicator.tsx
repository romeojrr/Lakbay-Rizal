import { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import { useSaveStatus } from '../../store/saveStatus';
import Dialog from '../Dialog/Dialog';
import styles from './SaveIndicator.module.css';

/** A 10 × 10 pixel floppy disk (decorative). */
function Disk() {
  return (
    <svg
      className={styles.disk}
      viewBox="0 0 10 10"
      width={20}
      height={20}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M0 0h8l2 2v8H0z" fill="currentColor" />
      <path d="M2 0h5v3H2z" fill="var(--ink)" />
      <path d="M2 6h6v3H2z" fill="var(--ink)" />
    </svg>
  );
}

/**
 * SRS v2.3 §3.9: after every save, "Saved" shows for 1.2 s next to a disk. If a save fails
 * (storage full or blocked), it turns into a red "Not saved" button that explains why and
 * points to the save code. Screen readers hear only the failure (every save would be noise).
 */
export default function SaveIndicator() {
  const { state, count } = useSaveStatus();
  const [open, setOpen] = useState(false);

  if (state === 'failed') {
    return (
      <span className={styles.slot} data-guide="save-indicator">
        <button type="button" className={styles.failed} onClick={() => setOpen(true)}>
          <Disk />
          {t('save.notSaved')}
        </button>
        <span className="visually-hidden" role="alert">
          {t('save.notSaved')}
        </span>
        <Dialog open={open} onClose={() => setOpen(false)} title={t('save.notSavedTitle')}>
          <p>{t('save.notSavedBody')}</p>
          <p>
            <Link to="/settings#save-code" onClick={() => setOpen(false)}>
              {t('save.getCode')}
            </Link>
          </p>
        </Dialog>
      </span>
    );
  }

  return (
    <span className={styles.slot} data-guide="save-indicator">
      <Disk />
      {state === 'saved' && (
        // A new key on every save replays the fade (1.2 s, ending invisible).
        <span key={count} className={`${styles.saved} motion-ok`} aria-hidden="true">
          {t('save.saved')}
        </span>
      )}
      <span className="visually-hidden">{t('save.autoSave')}</span>
    </span>
  );
}
