import type { Stop } from '../../content/schemas';
import type { PinState } from '../../features/map/mapModel';
import { t } from '../../i18n/t';

/** Pin fill: the theme color, or grey when locked (FR-12). */
export function pinColor(stop: Stop, state: PinState): string {
  return state === 'locked' ? 'var(--pin-locked)' : `var(--theme-${stop.theme})`;
}

/**
 * Accessible name, e.g. "Berlin, 1887, current stop" (FR-13). It starts with the visible
 * label so speech-control users can say what they see (WCAG 2.5.3). Locked pins show only
 * "?", which axe and speech input ignore, so their name does not reveal the place.
 */
export function pinName(stop: Stop, state: PinState): string {
  return t(`pin.${state}`, { place: stop.place.label, year: stop.year });
}
