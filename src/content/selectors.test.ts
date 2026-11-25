import { describe, expect, it } from 'vitest';
import { realContent } from '../test/content';
import type { Stop } from './schemas';
import {
  getNextStop,
  getStopById,
  getStopsByRegion,
  getThemeProgress,
  getThemeTotals,
  getVisibleStops,
  isFinalStop,
  isUnlocked,
  shouldIncludeDrafts,
  sortByOrder,
} from './selectors';

const { stops } = realContent();
const ids = (list: readonly Stop[]) => list.map((s) => s.id);
const byId = (id: string) => {
  const stop = getStopById(stops, id);
  if (!stop) throw new Error(`no stop ${id}`);
  return stop;
};
const noProgress = { completed: [] };
const firstN = (n: number) => ({ completed: ids(sortByOrder(stops).slice(0, n)) });

/** A copy of a stop turned into an outline ("coming soon") stop. */
function asOutline(stop: Stop): Stop {
  return {
    ...stop,
    status: 'outline',
    story: '[TO WRITE]',
    scene: { image: null, time: null, alt: '' },
    chapters: [],
    quiz: [],
    rewards: { stamp: { icon: null } },
  };
}

describe('getStopsByRegion', () => {
  it('matches the region table in SRS §3.3', () => {
    const orders = (region: Parameters<typeof getStopsByRegion>[1]) =>
      getStopsByRegion(stops, region).map((s) => s.order);
    expect(orders('philippines')).toEqual([1, 2, 3, 4, 13, 22, 23, 24, 25]);
    expect(orders('asia')).toEqual([14, 21]);
    expect(orders('europe')).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 20]);
    expect(orders('america')).toEqual([15]);
  });
});

describe('getNextStop', () => {
  it('starts at Calamba 1861 on a fresh profile', () => {
    expect(getNextStop(stops, noProgress)?.id).toBe('calamba-1861');
  });

  it('is the first stop not completed, in order', () => {
    expect(getNextStop(stops, firstN(3))?.id).toBe('ust-1877');
    // Completing a later stop out of order (Free mode) does not skip earlier ones.
    expect(getNextStop(stops, { completed: ['berlin-1887'] })?.id).toBe('calamba-1861');
  });

  it('is undefined when every stop is completed', () => {
    expect(getNextStop(stops, { completed: ids(stops) })).toBeUndefined();
  });

  it('skips outline stops', () => {
    const withOutline = stops.map((s) => (s.id === 'calamba-1861' ? asOutline(s) : s));
    expect(getNextStop(withOutline, noProgress)?.id).toBe('binan-1869');
  });
});

describe('isUnlocked', () => {
  it('Guided: only completed stops and the next one are open (GD-1)', () => {
    const progress = firstN(2);
    expect(isUnlocked(byId('calamba-1861'), stops, progress, 'guided')).toBe(true);
    expect(isUnlocked(byId('ateneo-1872'), stops, progress, 'guided')).toBe(true);
    expect(isUnlocked(byId('ust-1877'), stops, progress, 'guided')).toBe(false);
    expect(isUnlocked(byId('berlin-1887'), stops, progress, 'guided')).toBe(false);
  });

  it('Free: every playable stop is open (GD-2)', () => {
    expect(stops.every((s) => isUnlocked(s, stops, noProgress, 'free'))).toBe(true);
  });

  it('outline stops never open', () => {
    const outline = asOutline(byId('berlin-1887'));
    expect(isUnlocked(outline, [outline], noProgress, 'free')).toBe(false);
  });
});

describe('theme counts (FR-52)', () => {
  it('counts every stop once, from content', () => {
    const totals = getThemeTotals(stops);
    expect(Object.values(totals).reduce((a, b) => a + b, 0)).toBe(25);
    for (const [theme, total] of Object.entries(totals)) {
      expect(total).toBe(stops.filter((s) => s.theme === theme).length);
    }
  });

  it('does not count outline stops', () => {
    const totals = getThemeTotals([asOutline(byId('berlin-1887')), byId('leipzig-1886')]);
    expect(totals).toEqual({ study: 0, travel: 0, writing: 1, cause: 0, exile: 0 });
  });

  it('reports done / total per theme', () => {
    const progress = getThemeProgress(stops, { completed: ['berlin-1887', 'leipzig-1886'] });
    expect(progress.writing.done).toBe(2);
    expect(progress.writing.total).toBe(getThemeTotals(stops).writing);
    expect(progress.study.done).toBe(0);
  });
});

describe('isFinalStop', () => {
  it('is true only for Bagumbayan', () => {
    expect(stops.filter((s) => isFinalStop(s, stops)).map((s) => s.id)).toEqual([
      'bagumbayan-1896',
    ]);
  });
});

describe('draft visibility (FR-62)', () => {
  it('hides drafts unless they are allowed', () => {
    expect(getVisibleStops(stops, false)).toEqual([]);
    expect(getVisibleStops(stops, true)).toHaveLength(25);
    const berlin = byId('berlin-1887');
    if (berlin.status === 'outline') throw new Error('expected a playable stop');
    const verified: Stop = { ...berlin, status: 'verified' };
    expect(ids(getVisibleStops([...stops, verified], false))).toEqual(['berlin-1887']);
  });

  it('allows drafts in dev, with the build flag, or in preview mode', () => {
    const off = { dev: false, buildFlag: false, previewParam: false };
    expect(shouldIncludeDrafts(off)).toBe(false);
    expect(shouldIncludeDrafts({ ...off, dev: true })).toBe(true);
    expect(shouldIncludeDrafts({ ...off, buildFlag: true })).toBe(true);
    expect(shouldIncludeDrafts({ ...off, previewParam: true })).toBe(true);
  });
});
