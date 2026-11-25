// Read-only helpers over the loaded content (SRS §8.3). No React, no storage.
import { THEMES } from './constants';
import type { RegionId, Stop, Theme } from './schemas';

export type JourneyMode = 'guided' | 'free';

/** The part of the saved progress (SRS §8.4) that the selectors need. */
export interface ProgressLike {
  completed: readonly string[];
}

export function sortByOrder(stops: readonly Stop[]): Stop[] {
  return [...stops].sort((a, b) => a.order - b.order);
}

export function getStopById(stops: readonly Stop[], id: string): Stop | undefined {
  return stops.find((stop) => stop.id === id);
}

export function getStopsByRegion(stops: readonly Stop[], region: RegionId): Stop[] {
  return sortByOrder(stops.filter((stop) => stop.region === region));
}

/** The final stop is the last one in order (Bagumbayan, SRS GD-6). */
export function isFinalStop(stop: Stop, stops: readonly Stop[]): boolean {
  return stops.every((other) => other.order <= stop.order);
}

/** The first playable stop, in order, that is not completed yet. */
export function getNextStop(stops: readonly Stop[], progress: ProgressLike): Stop | undefined {
  const completed = new Set(progress.completed);
  return sortByOrder(stops).find((stop) => stop.status !== 'outline' && !completed.has(stop.id));
}

/**
 * GD-1 / GD-2: in Free mode every playable stop is open; in Guided mode only
 * completed stops and the next unfinished one. Outline stops never open.
 */
export function isUnlocked(
  stop: Stop,
  stops: readonly Stop[],
  progress: ProgressLike,
  mode: JourneyMode,
): boolean {
  if (stop.status === 'outline') return false;
  if (mode === 'free') return true;
  return progress.completed.includes(stop.id) || getNextStop(stops, progress)?.id === stop.id;
}

/** Number of playable stops per theme, counted from content (FR-52). */
export function getThemeTotals(stops: readonly Stop[]): Record<Theme, number> {
  const totals = Object.fromEntries(THEMES.map((theme) => [theme, 0])) as Record<Theme, number>;
  for (const stop of stops) {
    if (stop.status !== 'outline') totals[stop.theme] += 1;
  }
  return totals;
}

export function getThemeProgress(
  stops: readonly Stop[],
  progress: ProgressLike,
): Record<Theme, { done: number; total: number }> {
  const completed = new Set(progress.completed);
  const totals = getThemeTotals(stops);
  const result = Object.fromEntries(
    THEMES.map((theme) => [theme, { done: 0, total: totals[theme] }]),
  ) as Record<Theme, { done: number; total: number }>;
  for (const stop of stops) {
    if (stop.status !== 'outline' && completed.has(stop.id)) result[stop.theme].done += 1;
  }
  return result;
}

/** FR-62: production shows only verified stops unless drafts are allowed. */
export function getVisibleStops(stops: readonly Stop[], includeDrafts: boolean): Stop[] {
  return sortByOrder(includeDrafts ? stops : stops.filter((stop) => stop.status === 'verified'));
}

/**
 * FR-62: drafts show in development, in builds made with INCLUDE_DRAFTS=true,
 * and in `?preview=1` mode.
 */
export function shouldIncludeDrafts(options: {
  dev: boolean;
  buildFlag: boolean;
  previewParam: boolean;
}): boolean {
  return options.dev || options.buildFlag || options.previewParam;
}
