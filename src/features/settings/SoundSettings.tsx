import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import styles from './SettingsPage.module.css';

/** §3.11: Sound on/off (default on), Music on/off (default off), volume. Saved with progress. */
export default function SoundSettings() {
  const { sound, music, volume } = useProgress((s) => s.settings);
  const setSettings = useProgress((s) => s.setSettings);
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{t('settings.sound')}</legend>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={sound}
          onChange={(e) => setSettings({ sound: e.target.checked })}
        />
        <span>{t('settings.soundEffects')}</span>
      </label>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={music}
          onChange={(e) => setSettings({ music: e.target.checked })}
        />
        <span>{t('settings.music')}</span>
      </label>
      <p className={styles.help}>{t('settings.musicHelp')}</p>
      <label className={styles.range}>
        <span>{t('settings.volume')}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={Math.round(volume * 100)}
          onChange={(e) => setSettings({ volume: Number(e.target.value) / 100 })}
        />
      </label>
    </fieldset>
  );
}
