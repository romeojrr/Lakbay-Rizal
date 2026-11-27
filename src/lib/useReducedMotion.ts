// FR-71 / SRS v2.3 §5.6: reduced motion follows the device unless Settings says On or Off.
import { useSyncExternalStore } from 'react';
import { useProgress } from '../store/progress';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener?.('change', onChange);
  return () => media.removeEventListener?.('change', onChange);
}

const deviceWantsLess = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches;

/** The device itself asks for less motion (e.g. Windows "Animation effects" is off). */
export function useDeviceWantsLessMotion(): boolean {
  return useSyncExternalStore(subscribe, deviceWantsLess, () => false);
}

export function useReducedMotion(): boolean {
  const setting = useProgress((s) => s.settings.reduceMotion);
  const device = useSyncExternalStore(subscribe, deviceWantsLess, () => false);
  return setting === 'on' || (setting === 'system' && device);
}
