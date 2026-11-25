import { useEffect, useRef } from 'react';
import type { PinGroup } from '../../features/map/mapModel';
import StopRow from '../StopRow/StopRow';
import styles from './MapView.module.css';

interface ClusterListProps {
  id: string;
  group: PinGroup;
  onLocked: () => void;
  onClose: () => void;
}

/** The stops inside a cluster pin, shown next to it. Esc or a click elsewhere closes it. */
export default function ClusterList({ id, group, onLocked, onClose }: ClusterListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const below = group.point.y < 55;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const opener = document.querySelector(`[aria-controls="${id}"]`);
      if (!ref.current?.contains(target) && !opener?.contains(target)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [id, onClose]);

  return (
    <div
      ref={ref}
      id={id}
      className={styles.clusterList}
      style={{
        left: `clamp(4px, calc(${group.point.x}% - 110px), calc(100% - 224px))`,
        ...(below
          ? { top: `calc(${group.point.y}% + 26px)` }
          : { bottom: `calc(${100 - group.point.y}% + 56px)` }),
      }}
    >
      <ol className={styles.clusterRows}>
        {group.members.map((m) => (
          <StopRow key={m.stop.id} member={m} onLocked={onLocked} />
        ))}
      </ol>
    </div>
  );
}
