// FR-73: every UI string lives in src/i18n/en.json, so components must not contain
// hard-coded words in JSX text or in user-facing attributes.
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>('../**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Text between JSX tags that contains a letter, e.g. `<span>Next</span>`.
// Lines with code operators are skipped, so comparisons like `a > b && c < d` do not count.
const JSX_TEXT = /(?<![=-])>\s*([^<>{}\n]*[A-Za-z][^<>{}\n]*?)\s*</g;
const CODE = /&&|\|\||=|\(|\)|;|=>/;
// User-facing attributes written as string literals.
const ATTRIBUTE = /\b(aria-label|alt|title|placeholder)="([^"]*[A-Za-z][^"]*)"/g;

function findHardcoded(file: string, code: string): string[] {
  const found: string[] = [];
  code.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;
    for (const match of line.matchAll(JSX_TEXT)) {
      const text = match[1] ?? '';
      if (!CODE.test(text)) found.push(`${file}:${i + 1}  ${text.trim()}`);
    }
    for (const match of line.matchAll(ATTRIBUTE)) {
      found.push(`${file}:${i + 1}  ${match[1]}="${match[2]}"`);
    }
  });
  return found;
}

describe('UI strings (FR-73)', () => {
  it('scans the components', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(30);
  });

  it('has no hard-coded words in components', () => {
    const problems = Object.entries(sources)
      .filter(([file]) => !file.includes('.test.'))
      .flatMap(([file, code]) => findHardcoded(file, code));
    expect(problems).toEqual([]);
  });

  it('catches a hard-coded string', () => {
    expect(findHardcoded('x.tsx', '<button>Next</button>')).toHaveLength(1);
    expect(findHardcoded('x.tsx', '<img alt="A map" />')).toHaveLength(1);
    expect(findHardcoded('x.tsx', '<button>{t("stop.next")}</button>')).toEqual([]);
    expect(findHardcoded('x.tsx', 'if (a > b && c < d) return;')).toEqual([]);
    expect(findHardcoded('x.tsx', 'type L = () => Promise<Data>;')).toEqual([]);
  });
});
