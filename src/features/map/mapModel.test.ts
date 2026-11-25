import { describe, expect, it } from 'vitest';
import type { RegionId, Stop } from '../../content/schemas';
import { sortByOrder } from '../../content/selectors';
import { realContent } from '../../test/content';
import {
  buildPinGroups,
  buildTravelPath,
  clusterByDistance,
  defaultTimelineYear,
  getPinState,
  getTimelineStop,
  groupLabel,
  toMapStops,
  type PinGroup,
} from './mapModel';

const { stops, regions } = realContent();
const region = (id: RegionId) => {
  const r = regions.find((x) => x.id === id);
  if (!r) throw new Error(id);
  return r;
};
const byId = (id: string) => {
  const s = stops.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};
const firstN = (n: number) => ({
  completed: sortByOrder(stops)
    .slice(0, n)
    .map((s) => s.id),
});
const fresh = { completed: [] as string[] };
const groupIds = (groups: PinGroup[]) => groups.map((g) => g.members.map((m) => m.stop.id));

describe('getPinState (FR-12)', () => {
  it('Guided, fresh profile: Calamba 1861 is current, the rest locked', () => {
    expect(getPinState(byId('calamba-1861'), stops, fresh, 'guided')).toBe('current');
    expect(getPinState(byId('binan-1869'), stops, fresh, 'guided')).toBe('locked');
  });

  it('marks completed stops done and the next one current', () => {
    const progress = firstN(5);
    expect(getPinState(byId('barcelona-1882'), stops, progress, 'guided')).toBe('done');
    expect(getPinState(byId('madrid-1882'), stops, progress, 'guided')).toBe('current');
    expect(getPinState(byId('paris-1885'), stops, progress, 'guided')).toBe('locked');
  });

  it('Free mode opens every stop that is not done or current', () => {
    expect(getPinState(byId('berlin-1887'), stops, fresh, 'free')).toBe('open');
  });
});

describe('buildPinGroups (FR-15)', () => {
  it('Philippines: the stops inside the Manila inset form one cluster; Dapitan stays alone', () => {
    const ph = region('philippines');
    const groups = buildPinGroups(ph, toMapStops(ph, stops, fresh, 'guided'), 1861, undefined);
    expect(groups.map((g) => g.kind)).toEqual(['inset', 'single']);
    expect(groupIds(groups)).toEqual([
      [
        'calamba-1861',
        'binan-1869',
        'ateneo-1872',
        'ust-1877',
        'calamba-1887',
        'manila-1892',
        'fortsantiago-1896',
        'bagumbayan-1896',
      ],
      ['dapitan-1892'],
    ]);
  });

  it('Europe: overlapping towns are grouped, the others stay single', () => {
    const eu = region('europe');
    const groups = buildPinGroups(eu, toMapStops(eu, stops, fresh, 'free'), 1896, undefined);
    const clusters = groups.filter((g) => g.kind === 'cluster').map(groupLabel);
    expect(clusters).toEqual(['Paris', 'Heidelberg · Wilhelmsfeld', 'Brussels · Ghent']);
    expect(groups.filter((g) => g.kind === 'single')).toHaveLength(7);
  });

  it('dims groups after the timeline year and highlights the timeline stop (FR-21)', () => {
    const ph = region('philippines');
    const groups = buildPinGroups(ph, toMapStops(ph, stops, fresh, 'guided'), 1869, 'binan-1869');
    const [manila, dapitan] = groups;
    expect(manila?.dimmed).toBe(false);
    expect(manila?.highlighted).toBe(true);
    expect(dapitan?.dimmed).toBe(true);
  });

  it('a cluster is led by its current stop', () => {
    const ph = region('philippines');
    const groups = buildPinGroups(ph, toMapStops(ph, stops, firstN(2), 'guided'), 1872, undefined);
    expect(groups[0]?.lead.stop.id).toBe('ateneo-1872');
  });
});

describe('clusterByDistance', () => {
  it('chains points that are each close to a neighbour', () => {
    const at = (x: number) => ({ point: { x, y: 50 } });
    const groups = clusterByDistance([at(10), at(11), at(12), at(50)], { w: 400, h: 100 });
    expect(groups.map((g) => g.length)).toEqual([3, 1]);
  });
});

describe('buildTravelPath (FR-14)', () => {
  it('draws the travelled line through done stops and on to the current one', () => {
    const eu = region('europe');
    const mapStops = toMapStops(eu, stops, firstN(7), 'guided');
    const path = buildTravelPath(mapStops, 1896);
    // Barcelona, Madrid, Paris done; Heidelberg current.
    expect(path.travelled).toHaveLength(4);
    expect(path.ahead[0]).toEqual(path.travelled.at(-1));
    expect(path.ahead).toHaveLength(1 + 9);
  });

  it('stops the travelled line at the timeline year', () => {
    const eu = region('europe');
    const path = buildTravelPath(toMapStops(eu, stops, firstN(7), 'guided'), 1882);
    expect(path.travelled).toHaveLength(2);
  });

  it('has no travelled line on a fresh profile in a region not visited yet', () => {
    const eu = region('europe');
    expect(buildTravelPath(toMapStops(eu, stops, fresh, 'guided'), 1896).travelled).toEqual([]);
  });
});

describe('timeline (SRS §3.4)', () => {
  it('finds where Rizal was in a year', () => {
    const at = (year: number) => getTimelineStop(stops, year)?.id;
    expect(at(1861)).toBe('calamba-1861');
    expect(at(1888)).toBe('london-1888');
    expect(at(1891)).toBe('hongkong-1891');
    expect(at(1892)).toBe('dapitan-1892');
    expect(at(1896)).toBe('bagumbayan-1896');
  });

  it('falls back to the first stop before 1861', () => {
    expect(getTimelineStop(stops, 1850)?.id).toBe('calamba-1861');
  });

  it('starts at the year of the next stop', () => {
    expect(defaultTimelineYear(stops, fresh)).toBe(1861);
    expect(defaultTimelineYear(stops, firstN(10))).toBe(1887);
    const all = { completed: stops.map((s: Stop) => s.id) };
    expect(defaultTimelineYear(stops, all)).toBe(1896);
  });
});
