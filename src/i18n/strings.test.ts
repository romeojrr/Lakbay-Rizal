// SRS v2.3 §3.10: UI strings in English and Filipino, seeded from content/i18n/*.ui.json.
import { afterEach, describe, expect, it } from 'vitest';
import enSeed from '../../content/i18n/en.ui.json';
import filSeed from '../../content/i18n/fil.ui.json';
import en from './en.json';
import fil from './fil.json';
import { detectLanguage } from './language';
import { hasOwnString, setActiveLanguage, t, type MessageKey } from './t';

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else Object.assign(out, leaves(value, path));
  }
  return out;
}

const EN = leaves(en);
const FIL = leaves(fil);
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

// The app already used these keys for a different string, so the app's English stays and
// the seed's Filipino does not fit it (see docs/DECISIONS.md, U2).
const KEPT_APP_STRINGS = ['passport.stamps', 'settings.resetConfirm'];

afterEach(() => setActiveLanguage('en'));

describe('UI strings (§3.10)', () => {
  it('has every key of content/i18n/en.ui.json', () => {
    const missing = Object.keys(enSeed).filter((key) => !(key in EN));
    expect(missing).toEqual([]);
  });

  it('uses the seeded English unless the app already had its own string', () => {
    const differ = Object.entries(enSeed as Record<string, string>)
      .filter(([key, value]) => EN[key] !== value)
      .map(([key]) => key);
    expect(differ).toEqual(KEPT_APP_STRINGS);
  });

  it('has every Filipino seed string from content/i18n/fil.ui.json', () => {
    const seed = filSeed as Record<string, string>;
    for (const [key, value] of Object.entries(seed)) {
      if (KEPT_APP_STRINGS.includes(key)) expect(FIL[key]).toBeUndefined();
      else expect(FIL[key], key).toBe(value);
    }
  });

  it('Filipino has no keys that English lacks, and the same {placeholders}', () => {
    for (const [key, value] of Object.entries(FIL)) {
      expect(EN[key], `${key} is not in en.json`).toBeDefined();
      expect(placeholders(value), key).toEqual(placeholders(EN[key] ?? ''));
    }
  });
});

describe('t() (FR-73, §3.10)', () => {
  it('uses the active language and fills placeholders', () => {
    setActiveLanguage('fil');
    expect(t('nav.map')).toBe('Mapa');
    expect(t('stop.chapter', { n: 2, total: 4 })).toBe('Kabanata 2 ng 4');
    setActiveLanguage('en');
    expect(t('nav.map')).toBe('Map');
  });

  it('falls back to English for a string Filipino does not have, one string at a time', () => {
    setActiveLanguage('fil');
    expect(hasOwnString('fil', 'settings.verifyNotes')).toBe(false);
    expect(t('settings.verifyNotes')).toBe('Show verify notes (team)');
    expect(t('nav.journal')).toBe('Talaarawan');
  });

  it('returns the key itself for an unknown key', () => {
    expect(t('no.such.key' as MessageKey)).toBe('no.such.key');
  });
});

describe('detectLanguage (§3.10)', () => {
  it('is Filipino for fil and tl browsers, English otherwise', () => {
    expect(detectLanguage(['fil-PH', 'en'])).toBe('fil');
    expect(detectLanguage(['tl'])).toBe('fil');
    expect(detectLanguage(['TL-ph'])).toBe('fil');
    expect(detectLanguage(['en-PH', 'fil'])).toBe('en');
    expect(detectLanguage(['es'])).toBe('en');
    expect(detectLanguage([])).toBe('en');
    expect(detectLanguage(undefined)).toBe('en');
  });
});
