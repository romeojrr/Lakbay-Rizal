import { Fragment, useLayoutEffect, type ReactNode } from 'react';
import { HTML_LANG } from '../i18n/language';
import { setActiveLanguage } from '../i18n/t';
import { useLanguage } from '../i18n/useLanguage';

/**
 * SRS v2.3 §3.10: switching language changes every string without a reload. t() is a plain
 * function, so the app below is rendered again from scratch (keyed by the language); saved
 * progress and the router's place are kept. The control used gets the focus back.
 */
export default function LanguageRoot({ children }: { children: ReactNode }) {
  const lang = useLanguage();
  // Before the children render, so every t() call this render uses the new language.
  setActiveLanguage(lang);
  useLayoutEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);
  return <Fragment key={lang}>{children}</Fragment>;
}
