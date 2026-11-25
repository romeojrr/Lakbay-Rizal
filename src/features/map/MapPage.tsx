import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import InsetMap from '../../components/InsetMap/InsetMap';
import JourneyList from '../../components/JourneyList/JourneyList';
import MapView from '../../components/MapView/MapView';
import ModeToggle from '../../components/ModeToggle/ModeToggle';
import Panel from '../../components/Panel/Panel';
import RegionTabs from '../../components/RegionTabs/RegionTabs';
import SidePanel from '../../components/SidePanel/SidePanel';
import StopCard from '../../components/StopCard/StopCard';
import TimelineSlider from '../../components/TimelineSlider/TimelineSlider';
import Toast from '../../components/Toast/Toast';
import { REGION_IDS } from '../../content/constants';
import type { RegionId } from '../../content/schemas';
import { getNextStop } from '../../content/selectors';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
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
  const setTimelineYear = useUi((s) => s.setTimelineYear);
  const setLastRegion = useUi((s) => s.setLastRegion);
  const timelineExpanded = useUi((s) => s.timelineExpanded);
  const setTimelineExpanded = useUi((s) => s.setTimelineExpanded);
  const panelCollapsed = useProgress((s) => s.settings.panelCollapsed);
  const setSettings = useProgress((s) => s.setSettings);
  const navigate = useNavigate();
  const location = useLocation();
  const insetRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const region = content.regions.find((r) => r.id === regionId);
  const progress = useMemo(() => ({ completed }), [completed]);
  const openTimeline = (location.state as { openTimeline?: boolean } | null)?.openTimeline;

  useEffect(() => {
    if (region) setLastRegion(region.id);
  }, [region, setLastRegion]);

  // Bottom navigation "Timeline" (phones): open the strip and bring it into view.
  useEffect(() => {
    if (!openTimeline) return;
    setTimelineExpanded(true);
    timelineRef.current?.scrollIntoView?.({ block: 'center' });
    timelineRef.current?.querySelector<HTMLElement>('[role="slider"]')?.focus();
  }, [openTimeline, location.key, setTimelineExpanded]);

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
        <Link to="/">{t('map.backToMap')}</Link>
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

  // FR-21: moving the timeline to a year spent in another region switches the map.
  const changeYear = (next: number) => {
    setTimelineYear(next);
    const target = getTimelineStop(stops, next);
    if (target && target.region !== region.id) {
      const from = REGION_IDS.indexOf(target.region) > REGION_IDS.indexOf(region.id);
      navigate(`/region/${target.region satisfies RegionId}`, {
        state: { slideFrom: from ? 'right' : 'left' } satisfies SlideState,
      });
    }
  };

  // §5.5 map screen: grid of map | side panel (collapsible), timeline strip under the map.
  return (
    <div className={styles.screen}>
      <div className={styles.phoneTabs}>
        <RegionTabs regions={content.regions} nextRegion={nextStop?.region} />
      </div>
      <div className={cx(styles.grid, panelCollapsed && styles.collapsed)}>
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
          <div ref={timelineRef}>
            <TimelineSlider
              value={year}
              onChange={changeYear}
              expanded={timelineExpanded}
              onToggleExpanded={setTimelineExpanded}
            />
          </div>
        </section>
        <SidePanel
          collapsed={panelCollapsed}
          onToggleCollapsed={() => setSettings({ panelCollapsed: !panelCollapsed })}
        >
          <ModeToggle mode={mode} onChange={setMode} />
          {region.inset && insetGroup && (
            <InsetMap
              ref={insetRef}
              inset={region.inset}
              group={insetGroup}
              onLocked={showLocked}
            />
          )}
          {stops.length > 0 && (
            <StopCard
              member={cardMember}
              regionLabel={region.label}
              nextElsewhere={nextStop && nextStop.region !== region.id ? nextStop : undefined}
            />
          )}
          {mapStops.length > 0 && <JourneyList members={mapStops} onLocked={showLocked} />}
        </SidePanel>
      </div>
      <Toast message={message} />
    </div>
  );
}
