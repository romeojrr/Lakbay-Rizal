// Filipino content (SRS v2.3 §3.10): public/content/i18n/fil.*.json, fetched only when the
// player picks Filipino, then kept in memory. If it cannot be fetched (offline before the
// files were cached), the game keeps the English text: it never blocks on a translation.
import { FIL_CONTENT_FILES } from './constants';
import type { FilContent } from './schemas.v3';

let cache: Promise<FilContent | null> | null = null;
let loaded: FilContent | null = null;

export function loadTranslations(fetchImpl: typeof fetch = fetch): Promise<FilContent | null> {
  cache ??= fetchAll(fetchImpl).then(
    (content) => {
      loaded = content;
      return content;
    },
    () => {
      cache = null; // try again next time
      return null;
    },
  );
  return cache;
}

/** The Filipino content if it has been loaded, else null. */
export function getTranslations(): FilContent | null {
  return loaded;
}

/** §3.10: show the "Draft translation" badge until every Filipino file is "reviewed". */
export function isDraftTranslation(content: FilContent | null): boolean {
  if (!content) return true;
  return FIL_CONTENT_FILES.some((name) => content[name].status !== 'reviewed');
}

/** For tests. */
export function clearTranslations(): void {
  cache = null;
  loaded = null;
}

async function fetchAll(fetchImpl: typeof fetch): Promise<FilContent> {
  const entries = await Promise.all(
    FIL_CONTENT_FILES.map(async (name) => {
      const response = await fetchImpl(`${import.meta.env.BASE_URL}content/${name}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${name}.json`);
      return [name, (await response.json()) as unknown] as const;
    }),
  );
  const content = Object.fromEntries(entries) as unknown as FilContent;
  if (import.meta.env.DEV) {
    // The build checks these files fully; in development, catch a broken file early.
    const { FIL_FILE_SCHEMAS } = await import('./schemas.v3');
    for (const name of FIL_CONTENT_FILES) {
      const result = FIL_FILE_SCHEMAS[name].safeParse(content[name]);
      if (!result.success) console.warn(`[content] ${name}.json:`, result.error.issues);
    }
  }
  return content;
}
