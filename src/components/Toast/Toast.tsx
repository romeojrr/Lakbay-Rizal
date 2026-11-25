import { cx } from '../../lib/cx';
import styles from './Toast.module.css';

/** A short message at the bottom of the screen. Always rendered so screen readers hear changes. */
export default function Toast({ message }: { message: string | null }) {
  return (
    <div className={cx(styles.toast, message && styles.visible)} role="status" aria-live="polite">
      {message}
    </div>
  );
}
