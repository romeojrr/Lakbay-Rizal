import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPreviewMode } from './preview';

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('preview mode (FR-62)', () => {
  it('turns on with ?preview=1 and stays on for the tab', () => {
    expect(isPreviewMode('')).toBe(false);
    expect(isPreviewMode('?preview=1')).toBe(true);
    expect(isPreviewMode('')).toBe(true);
    expect(isPreviewMode('?stop=berlin-1887')).toBe(true);
  });

  it('turns off with ?preview=0', () => {
    isPreviewMode('?preview=1');
    expect(isPreviewMode('?preview=0')).toBe(false);
    expect(isPreviewMode('')).toBe(false);
  });

  it('falls back to the URL alone when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(isPreviewMode('?preview=1')).toBe(true);
    expect(isPreviewMode('')).toBe(false);
  });
});
