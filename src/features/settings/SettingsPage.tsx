import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import DraftBadge from '../../components/LanguageSwitch/DraftBadge';
import ModeToggle from '../../components/ModeToggle/ModeToggle';
import Panel from '../../components/Panel/Panel';
import { getTranslations, isDraftTranslation } from '../../content/translations';
import { LANGS, type Lang } from '../../i18n/language';
import { t, type MessageKey } from '../../i18n/t';
import { changeLanguage, useLanguage, useRestoreFocus } from '../../i18n/useLanguage';
import { useProgress, type Progress } from '../../store/progress';
import { useUi } from '../../store/ui';
import styles from './SettingsPage.module.css';

type Settings = Progress['settings'];

interface ChoiceProps<K extends 'textSize' | 'reduceMotion'> {
  name: K;
  legend: MessageKey;
  help?: MessageKey;
  options: { value: Settings[K]; label: MessageKey }[];
}

function Choice<K extends 'textSize' | 'reduceMotion'>({
  name,
  legend,
  help,
  options,
}: ChoiceProps<K>) {
  const value = useProgress((s) => s.settings[name]);
  const setSettings = useProgress((s) => s.setSettings);
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{t(legend)}</legend>
      {help && <p className={styles.help}>{t(help)}</p>}
      <div className={styles.segments}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => setSettings({ [name]: option.value } as Partial<Settings>)}
            />
            <span>{t(option.label)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function LanguageOption({ lang, current }: { lang: Lang; current: Lang }) {
  const ref = useRef<HTMLInputElement>(null);
  useRestoreFocus(`settings-${lang}`, ref);
  return (
    <label className={styles.segment}>
      <input
        ref={ref}
        type="radio"
        name="lang"
        value={lang}
        checked={current === lang}
        onChange={() => void changeLanguage(lang, `settings-${lang}`)}
      />
      <span lang={lang}>{t(`lang.${lang}`)}</span>
    </label>
  );
}

/** §3.10: the same choice as the EN | FIL switch in the top bar. */
function LanguageChoice() {
  const lang = useLanguage();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{t('settings.language')}</legend>
      <div className={styles.segments}>
        {LANGS.map((option) => (
          <LanguageOption key={option} lang={option} current={lang} />
        ))}
      </div>
      {lang === 'fil' && isDraftTranslation(getTranslations()) && (
        <p className={styles.help}>
          <DraftBadge wide />
        </p>
      )}
    </fieldset>
  );
}

/** /settings — language, text size, motion, journey mode, verify notes, reset (FR-71). */
export default function SettingsPage() {
  const mode = useProgress((s) => s.mode);
  const setMode = useProgress((s) => s.setMode);
  const showVerifyNotes = useProgress((s) => s.settings.showVerifyNotes);
  const setSettings = useProgress((s) => s.setSettings);
  const reset = useProgress((s) => s.reset);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const doReset = () => {
    reset();
    useUi.setState({ lastRegion: null, timelineYear: null });
    setConfirming(false);
    setMessage(t('settings.resetDone'));
  };

  return (
    <Panel className={styles.panel}>
      <h1 className={styles.title}>{t('settings.title')}</h1>
      <LanguageChoice />
      <Choice
        name="textSize"
        legend="settings.textSize"
        options={[
          { value: 'normal', label: 'settings.normal' },
          { value: 'large', label: 'settings.large' },
        ]}
      />
      <Choice
        name="reduceMotion"
        legend="settings.motion"
        help="settings.motionHelp"
        options={[
          { value: 'system', label: 'settings.system' },
          { value: 'on', label: 'settings.on' },
          { value: 'off', label: 'settings.off' },
        ]}
      />
      <div className={styles.fieldset}>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>
      <div className={styles.fieldset}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={showVerifyNotes}
            onChange={(e) => setSettings({ showVerifyNotes: e.target.checked })}
          />
          <span>{t('settings.verifyNotes')}</span>
        </label>
        <p className={styles.help}>{t('settings.verifyHelp')}</p>
      </div>
      <div className={styles.danger}>
        <h2 className={styles.legend}>{t('settings.reset')}</h2>
        <p className={styles.help}>{t('settings.resetHelp')}</p>
        <button type="button" className={styles.reset} onClick={() => setConfirming(true)}>
          {t('settings.reset')}
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={t('settings.resetConfirmTitle')}
        message={t('settings.resetConfirmBody')}
        confirmLabel={t('settings.resetConfirm')}
        onConfirm={doReset}
        onCancel={() => setConfirming(false)}
      />
      {message && (
        <p className={styles.help} role="status">
          {message} <Link to="/">{t('notFound.home')}</Link>
        </p>
      )}
    </Panel>
  );
}
