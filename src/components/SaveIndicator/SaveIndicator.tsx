import styles from './SaveIndicator.module.css';

/**
 * Save indicator slot (SRS v2.3 §3.9, `data-guide="save-indicator"`). U1 reserves the space so
 * the bar does not shift later; the "Saved" / "Not saved" logic arrives in U7.
 */
export default function SaveIndicator() {
  return <span className={styles.slot} data-guide="save-indicator" aria-live="polite" />;
}
