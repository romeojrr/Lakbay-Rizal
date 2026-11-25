import { t } from '../../i18n/t';
import Dialog from '../Dialog/Dialog';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks before doing something that cannot be undone (e.g. Reset progress, FR-71). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} closeLabel={t('settings.cancel')}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          {t('settings.keep')}
        </button>
        <button type="button" className={styles.confirm} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
