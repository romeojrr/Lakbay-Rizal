// UI strings (FR-73, SRS v2.3 §3.10). English is src/i18n/en.json; Filipino is fil.json.
// A string missing (or empty) in Filipino falls back to the English one, string by string.
import en from './en.json';
import fil from './fil.json';
import type { Lang } from './language';

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<typeof en>;

type Messages = { readonly [key: string]: string | Messages };

const MESSAGES: Record<Lang, Messages> = { en, fil };

let active: Lang = 'en';

/** The language t() uses. Set by the app root from the saved settings. */
export function setActiveLanguage(lang: Lang): void {
  active = lang;
}

export function getActiveLanguage(): Lang {
  return active;
}

function lookup(messages: Messages, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Messages | undefined)?.[part], messages);
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** Looks up a UI string by dotted key and fills `{name}` placeholders. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const value = lookup(MESSAGES[active], key) ?? lookup(en, key);
  if (value === undefined) return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** True when `key` has its own string in `lang` (no English fallback). For tests and tools. */
export function hasOwnString(lang: Lang, key: string): boolean {
  return lookup(MESSAGES[lang], key) !== undefined;
}
