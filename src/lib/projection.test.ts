import { describe, expect, it } from 'vitest';
import type { RegionId } from '../content/schemas';
import { realContent } from '../test/content';
import { isInsideMap, projectToPercent } from './projection';

const content = realContent();

function region(id: RegionId) {
  const found = content.regions.find((r) => r.id === id);
  if (!found) throw new Error(`no region ${id}`);
  return found;
}

function stopPlace(id: string) {
  const stop = content.stops.find((s) => s.id === id);
  if (!stop) throw new Error(`no stop ${id}`);
  return stop.place;
}

describe('projectToPercent', () => {
  it('FR-11: Berlin (52.52, 13.40) lands at about (63.8 %, 20.8 %) on the Europe map', () => {
    const point = projectToPercent(52.52, 13.4, region('europe'));
    expect(Math.abs(point.x - 63.8)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(point.y - 20.8)).toBeLessThanOrEqual(0.5);
  });

  it('puts the corners of the bounds at 0 % and 100 %', () => {
    const bounds = { lat0: 10, lat1: 20, lon0: 100, lon1: 120 };
    expect(projectToPercent(20, 100, bounds)).toEqual({ x: 0, y: 0 });
    expect(projectToPercent(10, 120, bounds)).toEqual({ x: 100, y: 100 });
  });

  // SRS §8.6 check values, using each stop's coordinates from content (tolerance ±1 %).
  const checks: [string, RegionId | 'inset', string, number, number][] = [
    ['Madrid', 'europe', 'madrid-1882', 22.4, 77.1],
    ['Barcelona', 'europe', 'barcelona-1882', 36.7, 72.6],
    ['Biarritz', 'europe', 'biarritz-1891', 27.6, 62.9],
    ['Paris', 'europe', 'paris-1885', 37.0, 37.9],
    ['London', 'europe', 'london-1888', 31.0, 25.4],
    ['Ghent', 'europe', 'ghent-1891', 40.4, 27.4],
    ['Heidelberg', 'europe', 'heidelberg-1886', 52.3, 35.1],
    ['Leipzig', 'europe', 'leipzig-1886', 61.5, 26.0],
    ['Berlin', 'europe', 'berlin-1887', 63.8, 20.8],
    ['Leitmeritz', 'europe', 'leitmeritz-1887', 65.6, 29.9],
    ['Manila', 'philippines', 'manila-1892', 40.6, 36.3],
    ['Dapitan', 'philippines', 'dapitan-1892', 56.3, 74.7],
    ['Manila (Intramuros, inset)', 'inset', 'ateneo-1872', 28.4, 19.9],
    ['Biñan (inset)', 'inset', 'binan-1869', 40.9, 51.1],
    ['Calamba (inset)', 'inset', 'calamba-1861', 52.3, 67.1],
    ['Tokyo', 'asia', 'japan-1888', 84.8, 19.6],
    ['Hong Kong', 'asia', 'hongkong-1891', 11.9, 80.5],
  ];

  it.each(checks)('%s matches the art', (_name, mapId, stopId, x, y) => {
    const bounds = mapId === 'inset' ? region('philippines').inset : region(mapId);
    if (!bounds) throw new Error('missing bounds');
    const { lat, lon } = stopPlace(stopId);
    const point = projectToPercent(lat, lon, bounds);
    expect(Math.abs(point.x - x)).toBeLessThanOrEqual(1);
    expect(Math.abs(point.y - y)).toBeLessThanOrEqual(1);
  });

  it('San Francisco and New York (ends of the America route) match the art', () => {
    const america = region('america');
    const route = america.route ?? [];
    const [sfLat, sfLon] = route[0] ?? [0, 0];
    const [nyLat, nyLon] = route.at(-1) ?? [0, 0];
    const sf = projectToPercent(sfLat, sfLon, america);
    const ny = projectToPercent(nyLat, nyLon, america);
    expect(Math.abs(sf.x - 6.4)).toBeLessThanOrEqual(1);
    expect(Math.abs(sf.y - 51.4)).toBeLessThanOrEqual(1);
    expect(Math.abs(ny.x - 92.8)).toBeLessThanOrEqual(1);
    expect(Math.abs(ny.y - 33.1)).toBeLessThanOrEqual(1);
  });
});

describe('isInsideMap', () => {
  it('accepts points on the map and rejects points off it', () => {
    expect(isInsideMap({ x: 0, y: 100 })).toBe(true);
    expect(isInsideMap({ x: -0.1, y: 50 })).toBe(false);
    expect(isInsideMap({ x: 50, y: 100.1 })).toBe(false);
  });
});
