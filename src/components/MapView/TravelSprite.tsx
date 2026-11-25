import { useEffect, useRef } from 'react';
import type { RegionId } from '../../content/schemas';
import type { PinGroup } from '../../features/map/mapModel';
import { asset } from '../../lib/asset';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useUi } from '../../store/ui';
import styles from './MapView.module.css';

/** §5.6: the island and Asian legs go by sea; Europe and America by train. */
const BY_SEA: readonly RegionId[] = ['philippines', 'asia'];
export const TRAVEL_MS = 1500;

export function groupOf(groups: readonly PinGroup[], stopId: string): PinGroup | undefined {
  return groups.find((g) => g.members.some((m) => m.stop.id === stopId));
}

/**
 * SRS v2.3 §5.6 travel animation: after a stop is completed, a small ship or train moves along
 * from its pin to the next one (1.5 s, transform only); then the next pin pops. Only when both
 * pins are on this map; with reduced motion there is no journey, the pin simply appears.
 */
export default function TravelSprite({ region, groups }: { region: RegionId; groups: PinGroup[] }) {
  const travel = useUi((s) => s.travel);
  const still = useReducedMotion();
  const ref = useRef<HTMLImageElement>(null);
  const from = travel ? groupOf(groups, travel.from) : undefined;
  const to = travel ? groupOf(groups, travel.to) : undefined;
  const moving = Boolean(from && to && from !== to && !still);

  useEffect(() => {
    if (!travel) return;
    if (!moving) {
      useUi.setState({ travel: null });
      return;
    }
    const img = ref.current;
    const layer = img?.parentElement;
    if (!img || !layer || !from || !to || typeof img.animate !== 'function') {
      useUi.setState({ travel: null });
      return;
    }
    const { width, height } = layer.getBoundingClientRect();
    const dx = ((to.point.x - from.point.x) / 100) * width;
    const dy = ((to.point.y - from.point.y) / 100) * height;
    const animation = img.animate(
      [
        { transform: 'translate(-50%, -100%)' },
        { transform: `translate(calc(-50% + ${dx}px), calc(-100% + ${dy}px))` },
      ],
      { duration: TRAVEL_MS, easing: 'ease-in-out', fill: 'forwards' },
    );
    animation.onfinish = () => useUi.setState({ travel: null });
    return () => animation.cancel();
    // Positions are read once per journey; a re-render must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travel, moving, from?.key, to?.key]);

  if (!moving || !from) return null;
  const sprite = BY_SEA.includes(region) ? 'travel_ship' : 'travel_train';
  return (
    <img
      ref={ref}
      className={`pix ${styles.vehicle}`}
      src={asset(`assets/sprites/${sprite}.png`)}
      alt=""
      style={{ left: `${from.point.x}%`, top: `${from.point.y}%` }}
    />
  );
}
