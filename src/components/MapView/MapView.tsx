import { useCallback, useEffect, useState } from 'react';
import type { Region } from '../../content/schemas';
import type { PinGroup, TravelPath } from '../../features/map/mapModel';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { projectToPercent } from '../../lib/projection';
import ClusterPin from '../ClusterPin/ClusterPin';
import Pin from '../Pin/Pin';
import pinStyles from '../Pin/Pin.module.css';
import { useUi } from '../../store/ui';
import TravelSprite, { groupOf } from './TravelSprite';
import WoodFrame from '../WoodFrame/WoodFrame';
import ClusterList from './ClusterList';
import MapOverlays from './MapOverlays';
import MapPath from './MapPath';
import styles from './MapView.module.css';
import { useZoomPan } from './useZoomPan';

interface MapViewProps {
  region: Region;
  groups: PinGroup[];
  path: TravelPath;
  /** Sprite drawn beside the current stop. */
  travellerSprite?: string;
  /** Slide in from this side when the timeline switched region (off with reduced motion). */
  slideFrom?: 'left' | 'right';
  /** Shown over the map when there are no stops to show (FR-62). */
  emptyMessage?: { title: string; body: string };
  onLocked: () => void;
  onOpenInset: () => void;
}

/** Regions whose pins have dropped in this visit (§5.6 "on first view"). */
const droppedRegions = new Set<string>();

/** Region map: pixel image, travel path, pins and overlays (FR-10 to FR-16). */
export default function MapView({
  region,
  groups,
  path,
  travellerSprite,
  slideFrom,
  emptyMessage,
  onLocked,
  onOpenInset,
}: MapViewProps) {
  const { viewportRef, zoom, compact, canZoomIn, canZoomOut, zoomIn, zoomOut, handlers } =
    useZoomPan();
  const [openCluster, setOpenCluster] = useState<string | null>(null);
  const closeCluster = useCallback(() => setOpenCluster(null), []);
  const current = groups.find((g) => g.members.some((m) => m.state === 'current'));
  const open = groups.find((g) => g.key === openCluster);
  const listId = (group: PinGroup) => `cluster-${group.key}`;
  const route = region.route?.map(([lat, lon]) => projectToPercent(lat, lon, region));
  // §5.6: pins drop in on a region's first view this visit.
  const [dropIn] = useState(() => !droppedRegions.has(region.id));
  useEffect(() => {
    droppedRegions.add(region.id);
  }, [region.id]);
  const travel = useUi((s) => s.travel);
  const arriving = travel ? groupOf(groups, travel.to) : undefined;

  return (
    <WoodFrame className={cx(slideFrom && styles[`slide-${slideFrom}`])}>
      <div
        className={cx('skeleton', styles.frame)}
        style={{ aspectRatio: `${region.w} / ${region.h}` }}
      >
        <div
          ref={viewportRef}
          className={cx(styles.viewport, zoom > 1 && styles.zoomed)}
          {...handlers}
        >
          <div
            className={cx(styles.layer, dropIn && pinStyles.dropIn)}
            style={{ width: `${zoom * 100}%`, aspectRatio: `${region.w} / ${region.h}` }}
          >
            <img
              className={`pix ${styles.image}`}
              src={asset(region.image)}
              alt={t('map.imageAlt', { region: region.label })}
              draggable={false}
            />
            <MapPath path={path} route={route} />
            <TravelSprite region={region.id} groups={groups} />
            {groups.map((group, index) =>
              group.kind === 'single' ? (
                <Pin
                  key={group.key}
                  group={group}
                  compact={compact}
                  onLocked={onLocked}
                  index={index}
                  arriving={arriving === group}
                />
              ) : (
                <ClusterPin
                  key={group.key}
                  group={group}
                  insetLabel={group.kind === 'inset' ? region.inset?.label : undefined}
                  compact={compact}
                  expanded={openCluster === group.key}
                  controls={group.kind === 'inset' ? (region.inset?.id ?? '') : listId(group)}
                  onActivate={() =>
                    group.kind === 'inset'
                      ? onOpenInset()
                      : setOpenCluster(openCluster === group.key ? null : group.key)
                  }
                />
              ),
            )}
            {current && travellerSprite && (
              <img
                className={`pix ${styles.traveller}`}
                src={asset(travellerSprite)}
                alt=""
                style={{
                  left: `calc(${current.point.x}% + 20px)`,
                  top: `calc(${current.point.y}% - 76px)`,
                }}
              />
            )}
            {open && (
              <ClusterList
                id={listId(open)}
                group={open}
                onLocked={onLocked}
                onClose={closeCluster}
              />
            )}
          </div>
        </div>
        <MapOverlays
          region={region}
          canZoomIn={canZoomIn}
          canZoomOut={canZoomOut}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
        />
        {emptyMessage && (
          <div className={styles.empty} role="status">
            <h2 className={styles.emptyTitle}>{emptyMessage.title}</h2>
            <p className={styles.emptyBody}>{emptyMessage.body}</p>
          </div>
        )}
      </div>
    </WoodFrame>
  );
}
