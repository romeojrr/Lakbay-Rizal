import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import InsetMap from '../../components/InsetMap/InsetMap';
import JourneyList from '../../components/JourneyList/JourneyList';
import MapView from '../../components/MapView/MapView';
import ModeToggle from '../../components/ModeToggle/ModeToggle';
import Panel from '../../components/Panel/Panel';
import RegionTabs from '../../components/RegionTabs/RegionTabs';
import StopCard from '../../components/StopCard/StopCard';
import Toast from '../../components/Toast/Toast';
import { getNextStop } from '../../content/selectors';
import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import {
  buildPinGroups,
  buildTravelPath,
  defaultTimelineYear,
  getTimelineStop,
  toMapStops,
} from './mapModel';
import styles from './MapPage.module.css';

const MESSAGE_MS = 3500;

interface SlideState {
  slideFrom?: 'left' | 'right';
}

/** /region/:regionId — the region map with side panel and timeline (M2). */
export default function MapPage() {
  const { regionId } = useParams();
  const { content, stops } = useRootData();
  const mode = useProgress((s) => s.mode);
  const completed = useProgress((s) => s.completed);
  const setMode = useProgress((s) => s.setMode);
  // Separate selectors: setting lastRegion must not re-render the whole map.
  const timelineYear = useUi((s) => s.timelineYear);
  const setLastRegion = useUi((s) => s.setLastRegion);
  const location = useLocation();
  const insetRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const region = content.regions.find((r) => r.id === regionId);
  const progress = useMemo(() => ({ completed }), [completed]);

  useEffect(() => {
    if (region) setLastRegion(region.id);
  }, [region, setLastRegion]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [message]);

  const showLocked = useCallback(() => setMessage(t('map.lockedMessage')), []);
  const openInset = useCallback(() => {
    insetRef.current?.scrollIntoView?.({ block: 'nearest' });
    insetRef.current?.focus({ preventScroll: true });
  }, []);

  if (!region) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>{t('map.notFoundTitle')}</h1>
        <Link to="/map">{t('map.backToMap')}</Link>
      </Panel>
    );
  }

  const year = timelineYear ?? defaultTimelineYear(stops, progress);
  const timelineStop = getTimelineStop(stops, year);
  const mapStops = toMapStops(region, stops, progress, mode);
  const groups = buildPinGroups(region, mapStops, year, timelineStop?.id);
  const insetGroup = groups.find((g) => g.kind === 'inset');
  const nextStop = getNextStop(stops, progress);
  const cardMember = mapStops.find((m) => m.state !== 'done');
  const slideFrom = (location.state as SlideState | null)?.slideFrom;

  // Map screen: the map on the left and, right beside it, the side panel (next stop, mode,
  // Manila inset, journey, the timeline page). Phones: the panel goes below the map.
  return (
    <div className={styles.screen}>
      <div className={styles.phoneTabs}>
        <RegionTabs regions={content.regions} nextRegion={nextStop?.region} />
      </div>
      <div className={styles.grid}>
        <section className={styles.mapArea} aria-label={t('map.section')}>
          <div
            className={styles.mapBox}
            data-guide="map"
            style={{ '--ratio': region.w / region.h } as CSSProperties}
          >
            <MapView
              key={region.id}
              region={region}
              groups={groups}
              path={buildTravelPath(mapStops, year)}
              travellerSprite={content.characters.rizal?.sprite}
              slideFrom={slideFrom}
              emptyMessage={
                stops.length === 0
                  ? { title: t('map.comingSoonTitle'), body: t('map.comingSoonBody') }
                  : undefined
              }
              onLocked={showLocked}
              onOpenInset={openInset}
            />
          </div>
        </section>
        <aside className={styles.panel} aria-label={t('panel.label')}>
          {stops.length > 0 && (
            <StopCard
              member={cardMember}
              regionLabel={region.label}
              nextElsewhere={nextStop && nextStop.region !== region.id ? nextStop : undefined}
            />
          )}
          <ModeToggle mode={mode} onChange={setMode} />
          {region.inset && insetGroup && (
            <InsetMap
              ref={insetRef}
              inset={region.inset}
              group={insetGroup}
              onLocked={showLocked}
            />
          )}
          {mapStops.length > 0 && <JourneyList members={mapStops} onLocked={showLocked} />}
          <Link to="/timeline" className={styles.timelineLink} data-guide="timeline">
            {t('stop.epilogueTimeline')} ▶
          </Link>
        </aside>
      </div>
      <Toast message={message} />
    </div>
  );
}
