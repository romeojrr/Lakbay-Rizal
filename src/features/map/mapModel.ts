// Pure logic behind the region map: pin states, grouping overlapping pins, the travel
// path and the timeline. No React here, so it is easy to test.
import type { Region, Stop } from '../../content/schemas';
import {
  getNextStop,
  isUnlocked,
  sortByOrder,
  type JourneyMode,
  type ProgressLike,
} from '../../content/selectors';
import { isInsideMap, projectToPercent, type MapBounds, type MapPoint } from '../../lib/projection';

export const TIMELINE_START = 1861;
export const TIMELINE_END = 1896;

/** Pins closer than this many pixels of the native map image are grouped (FR-15). */
export const CLUSTER_DISTANCE_PX = 8;

export type PinState = 'done' | 'current' | 'open' | 'locked';

export interface MapStop {
  stop: Stop;
  point: MapPoint;
  state: PinState;
}

export interface PinGroup {
  key: string;
  /** single = one stop; cluster = overlapping stops; inset = the stops shown in the region's inset map. */
  kind: 'single' | 'cluster' | 'inset';
  members: MapStop[];
  /** The member that decides the pin's color and state. */
  lead: MapStop;
  point: MapPoint;
  /** Every member is after the timeline year. */
  dimmed: boolean;
  /** Holds the stop the timeline points at. */
  highlighted: boolean;
}

export function getPinState(
  stop: Stop,
  allStops: readonly Stop[],
  progress: ProgressLike,
  mode: JourneyMode,
): PinState {
  if (progress.completed.includes(stop.id)) return 'done';
  if (getNextStop(allStops, progress)?.id === stop.id) return 'current';
  return isUnlocked(stop, allStops, progress, mode) ? 'open' : 'locked';
}

export function toMapStops(
  region: Region,
  allStops: readonly Stop[],
  progress: ProgressLike,
  mode: JourneyMode,
): MapStop[] {
  return sortByOrder(allStops.filter((s) => s.region === region.id)).map((stop) => ({
    stop,
    point: projectToPercent(stop.place.lat, stop.place.lon, region),
    state: getPinState(stop, allStops, progress, mode),
  }));
}

/** The member that best represents a group: current, else the latest done, else the first. */
export function leadOf(members: readonly MapStop[]): MapStop {
  const first = members[0];
  if (!first) throw new Error('leadOf: empty group');
  return (
    members.find((m) => m.state === 'current') ??
    [...members].reverse().find((m) => m.state === 'done') ??
    members.find((m) => m.state === 'open') ??
    first
  );
}

/** Groups points that are closer than `distancePx` on a `width` × `height` image. */
export function clusterByDistance<T extends { point: MapPoint }>(
  items: readonly T[],
  size: { w: number; h: number },
  distancePx = CLUSTER_DISTANCE_PX,
): T[][] {
  const parent = items.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] ?? i;
    return i;
  };
  items.forEach((a, i) => {
    items.forEach((b, j) => {
      if (j <= i) return;
      const dx = ((a.point.x - b.point.x) / 100) * size.w;
      const dy = ((a.point.y - b.point.y) / 100) * size.h;
      if (Math.hypot(dx, dy) < distancePx) parent[find(j)] = find(i);
    });
  });
  const groups = new Map<number, T[]>();
  items.forEach((item, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), item]);
  });
  return [...groups.values()];
}

function centroid(points: readonly MapPoint[]): MapPoint {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function isInsideBounds(stop: Stop, bounds: MapBounds): boolean {
  return isInsideMap(projectToPercent(stop.place.lat, stop.place.lon, bounds));
}

export function buildPinGroups(
  region: Region,
  mapStops: readonly MapStop[],
  timelineYear: number,
  timelineStopId: string | undefined,
): PinGroup[] {
  const inset = region.inset;
  const insetMembers = inset ? mapStops.filter((m) => isInsideBounds(m.stop, inset)) : [];
  const useInset = insetMembers.length >= 2;
  const rest = useInset ? mapStops.filter((m) => !insetMembers.includes(m)) : mapStops;

  const raw: { kind: PinGroup['kind']; members: MapStop[] }[] = [
    ...(useInset ? [{ kind: 'inset' as const, members: insetMembers }] : []),
    ...clusterByDistance(rest, region).map((members) => ({
      kind: members.length > 1 ? ('cluster' as const) : ('single' as const),
      members,
    })),
  ];

  return raw
    .map(({ kind, members }) => ({
      key: members.map((m) => m.stop.id).join('+'),
      kind,
      members,
      lead: leadOf(members),
      point: centroid(members.map((m) => m.point)),
      dimmed: members.every((m) => m.stop.year > timelineYear),
      highlighted: members.some((m) => m.stop.id === timelineStopId),
    }))
    .sort((a, b) => (a.members[0]?.stop.order ?? 0) - (b.members[0]?.stop.order ?? 0));
}

/** Unique place labels of a group, e.g. "Ghent · Brussels". */
export function groupLabel(group: PinGroup): string {
  return [...new Set(group.members.map((m) => m.stop.place.label))].join(' · ');
}

export interface TravelPath {
  /** Through completed stops (and the current one), up to the timeline year. */
  travelled: MapPoint[];
  /** From the end of the travelled line through the stops still ahead. */
  ahead: MapPoint[];
}

export function buildTravelPath(mapStops: readonly MapStop[], timelineYear: number): TravelPath {
  const travelled = mapStops
    .filter((m) => (m.state === 'done' || m.state === 'current') && m.stop.year <= timelineYear)
    .map((m) => m.point);
  const aheadStops = mapStops.filter((m) => m.state === 'open' || m.state === 'locked');
  const last = travelled.at(-1);
  const ahead = [...(last ? [last] : []), ...aheadStops.map((m) => m.point)];
  return { travelled, ahead: ahead.length >= 2 ? ahead : [] };
}

/** Where Rizal was in a given year: the last playable stop (in order) that started by then. */
export function getTimelineStop(stops: readonly Stop[], year: number): Stop | undefined {
  const playable = sortByOrder(stops).filter((s) => s.status !== 'outline');
  return [...playable].reverse().find((s) => s.year <= year) ?? playable[0];
}

/** The timeline starts at the year of the player's next stop. */
export function defaultTimelineYear(stops: readonly Stop[], progress: ProgressLike): number {
  return getNextStop(stops, progress)?.year ?? sortByOrder(stops).at(-1)?.year ?? TIMELINE_START;
}

export function clampYear(year: number): number {
  return Math.min(TIMELINE_END, Math.max(TIMELINE_START, Math.round(year)));
}
