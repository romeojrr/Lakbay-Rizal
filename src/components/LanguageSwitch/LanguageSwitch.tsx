import { useRef, useState } from 'react';
import { getTranslations, isDraftTranslation } from '../../content/translations';
import { LANGS, type Lang } from '../../i18n/language';
import { t } from '../../i18n/t';
import { changeLanguage, useLanguage, useRestoreFocus } from '../../i18n/useLanguage';
import DraftBadge from './DraftBadge';
import styles from './LanguageSwitch.module.css';

const SHORT = { en: 'lang.enShort', fil: 'lang.filShort' } as const;

function LangButton({
  lang,
  current,
  busy,
  onPick,
}: {
  lang: Lang;
  current: Lang;
  busy: boolean;
  onPick: (lang: Lang) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useRestoreFocus(`topbar-${lang}`, ref);
  return (
    <button
      ref={ref}
      type="button"
      lang={lang}
      className={styles.option}
      aria-pressed={lang === current}
      aria-busy={busy || undefined}
      onClick={() => onPick(lang)}
    >
      <span aria-hidden="true">{t(SHORT[lang])}</span>
      <span className="visually-hidden">
        {t('lang.named', { short: t(SHORT[lang]), name: t(`lang.${lang}`) })}
      </span>
    </button>
  );
}

/** EN | FIL in the top bar (SRS v2.3 §3.10), with the "Draft translation" badge. */
export default function LanguageSwitch() {
  const lang = useLanguage();
  const [busy, setBusy] = useState(false);

  const pick = (next: Lang) => {
    if (next === lang || busy) return;
    setBusy(true);
    void changeLanguage(next, `topbar-${next}`).finally(() => setBusy(false));
  };

  return (
    <div className={styles.wrap}>
      <div role="group" aria-label={t('settings.language')} className={styles.group}>
        {LANGS.map((option) => (
          <LangButton key={option} lang={option} current={lang} busy={busy} onPick={pick} />
        ))}
      </div>
      {lang === 'fil' && isDraftTranslation(getTranslations()) && <DraftBadge />}
    </div>
  );
}
