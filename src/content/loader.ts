// Fetches public/content/*.json once and keeps it in memory (SRS §8.3).
// In development the content is validated again so mistakes show up in the console.
import { CONTENT_FILES, type ContentFileName } from './constants';
import type { Content } from './schemas';
import type { StopV3 } from './schemas.v3';

export class ContentLoadError extends Error {
  override name = 'ContentLoadError';
}

let cache: Promise<Content> | null = null;

export function loadContent(fetchImpl: typeof fetch = fetch): Promise<Content> {
  cache ??= fetchContent(fetchImpl).catch((error: unknown) => {
    cache = null; // let the next call try again
    throw error;
  });
  return cache;
}

let storiesCache: Promise<StopV3[]> | null = null;

/**
 * Content v3 stops (SRS v2.3 §6.2b): the chapters and close-up lines the story player plays.
 * Until U4 the rest of the game still reads stops.json.
 */
export function loadStories(fetchImpl: typeof fetch = fetch): Promise<StopV3[]> {
  storiesCache ??= fetchJson(fetchImpl, 'stops.v3')
    .then(async (raw) => {
      if (import.meta.env.DEV) {
        const { StopsV3FileSchema } = await import('./schemas.v3');
        const result = StopsV3FileSchema.safeParse(raw);
        if (!result.success) {
          throw new ContentLoadError(`stops.v3.json is invalid: ${result.error.message}`);
        }
        return result.data;
      }
      return raw as StopV3[];
    })
    .catch((error: unknown) => {
      storiesCache = null;
      throw error;
    });
  return storiesCache;
}

/** For tests. */
export function clearContentCache(): void {
  cache = null;
  storiesCache = null;
}

async function fetchContent(fetchImpl: typeof fetch): Promise<Content> {
  const entries = await Promise.all(
    CONTENT_FILES.map(async (name) => [name, await fetchJson(fetchImpl, name)] as const),
  );
  const raw = Object.fromEntries(entries) as Record<ContentFileName, unknown>;

  if (import.meta.env.DEV) {
    const { validateContent, formatProblem } = await import('./validate');
    const result = validateContent(raw);
    for (const warning of result.warnings) console.warn(`[content] ${formatProblem(warning)}`);
    if (!result.content) {
      throw new ContentLoadError(
        `Content is invalid:\n${result.errors.map(formatProblem).join('\n')}`,
      );
    }
    return result.content;
  }
  // Production: the build already validated these exact files (scripts/validate-content.ts).
  return raw as unknown as Content;
}

async function fetchJson(
  fetchImpl: typeof fetch,
  name: ContentFileName | 'stops.v3',
): Promise<unknown> {
  const url = `${import.meta.env.BASE_URL}content/${name}.json`;
  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch (error) {
    throw new ContentLoadError(`Could not fetch ${url}`, { cause: error });
  }
  if (!response.ok) throw new ContentLoadError(`Could not fetch ${url} (HTTP ${response.status})`);
  try {
    return await response.json();
  } catch (error) {
    throw new ContentLoadError(`${url} is not valid JSON`, { cause: error });
  }
}
