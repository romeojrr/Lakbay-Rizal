// Fetches public/content/*.json once and keeps it in memory (SRS §8.3).
// In development the content is validated again so mistakes show up in the console.
import { CONTENT_FILES, V3_CONTENT_FILES, type ContentFileName } from './constants';
import type { Content } from './schemas';
import type { ContentV3 } from './schemas.v3';

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

let gameCache: Promise<ContentV3> | null = null;

/** guide.json and gamification.json (SRS v2.3 §3.7, §3.8). */
export function loadGameContent(fetchImpl: typeof fetch = fetch): Promise<ContentV3> {
  gameCache ??= Promise.all(V3_CONTENT_FILES.map((name) => fetchJson(fetchImpl, name)))
    .then(async ([guide, gamification]) => {
      if (import.meta.env.DEV) {
        const { GuideFileSchema, GamificationFileSchema } = await import('./schemas.v3');
        for (const [name, schema, value] of [
          ['guide', GuideFileSchema, guide],
          ['gamification', GamificationFileSchema, gamification],
        ] as const) {
          const result = schema.safeParse(value);
          if (!result.success) {
            throw new ContentLoadError(`${name}.json is invalid: ${result.error.message}`);
          }
        }
      }
      return { guide, gamification } as ContentV3;
    })
    .catch((error: unknown) => {
      gameCache = null;
      throw error;
    });
  return gameCache;
}

/** For tests. */
export function clearContentCache(): void {
  cache = null;
  gameCache = null;
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
  name: ContentFileName | (typeof V3_CONTENT_FILES)[number],
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
