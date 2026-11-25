import { afterEach, describe, expect, it, vi } from 'vitest';
import { rawContent } from '../test/content';
import { clearContentCache, ContentLoadError, loadContent } from './loader';

type Json = Record<string, unknown>;

function fakeFetch(overrides: Partial<Record<string, unknown>> = {}, status = 200) {
  const files = { ...rawContent(), ...overrides } as Record<string, unknown>;
  return vi.fn(async (input: RequestInfo | URL) => {
    const name = String(input).match(/content\/(\w+)\.json$/)?.[1] ?? '';
    return new Response(JSON.stringify(files[name]), { status: name in files ? status : 404 });
  });
}

afterEach(() => {
  clearContentCache();
  vi.restoreAllMocks();
});

describe('loadContent', () => {
  it('fetches the six content files once and caches them', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = fakeFetch();
    const content = await loadContent(fetchImpl);
    expect(content.stops).toHaveLength(25);
    expect(content.regions.map((r) => r.id)).toEqual(['philippines', 'asia', 'europe', 'america']);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
    expect(fetchImpl).toHaveBeenCalledWith('/content/stops.json');

    await loadContent(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it('logs content warnings in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await loadContent(fakeFetch());
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fortsantiago-1896'));
  });

  it('fails with a clear error when a file is missing, then retries on the next call', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing = fakeFetch({}, 404);
    await expect(loadContent(failing)).rejects.toThrow(ContentLoadError);
    await expect(loadContent(failing)).rejects.toThrow(/HTTP 404/);

    const content = await loadContent(fakeFetch());
    expect(content.stops).toHaveLength(25);
  });

  it('rejects invalid content in development, naming the stop and field', async () => {
    const stops = rawContent().stops as Json[];
    stops[0] = { ...stops[0], year: 1700 };
    await expect(loadContent(fakeFetch({ stops }))).rejects.toThrow(
      /stops\.json › calamba-1861 › year/,
    );
  });
});
