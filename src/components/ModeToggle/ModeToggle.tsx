import type { JourneyMode } from '../../content/selectors';
import { t } from '../../i18n/t';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode: JourneyMode;
  onChange: (mode: JourneyMode) => void;
}

const MODES: JourneyMode[] = ['guided', 'free'];

/** Guided journey vs Free explore (GD-1, GD-2, FR-18). */
export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div
      className={styles.toggle}
      role="group"
      aria-labelledby="mode-label"
      data-guide="mode-toggle"
    >
      <span id="mode-label" className={styles.label}>
        {t('mode.label')}
      </span>
      <div className={styles.buttons}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={styles.button}
            aria-pressed={mode === m}
            onClick={() => onChange(m)}
          >
            {t(`mode.${m}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
