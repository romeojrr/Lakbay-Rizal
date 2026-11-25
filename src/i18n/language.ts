// The game's two languages (SRS v2.3 §3.10).
export const LANGS = ['en', 'fil'] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (value: unknown): value is Lang => value === 'en' || value === 'fil';

/** Default: Filipino if the browser's language starts with `fil` or `tl`, otherwise English. */
export function detectLanguage(languages: readonly string[] | undefined): Lang {
  const first = languages?.find(Boolean)?.toLowerCase() ?? '';
  return first.startsWith('fil') || first.startsWith('tl') ? 'fil' : 'en';
}

export function browserLanguage(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  return detectLanguage(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

/** The value for `<html lang>`. */
export const HTML_LANG: Record<Lang, string> = { en: 'en', fil: 'fil' };
