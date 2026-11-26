import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import Chip from '../../components/Chip/Chip';
import Panel from '../../components/Panel/Panel';
import { REGION_IDS, THEMES } from '../../content/constants';
import type { RegionId, Theme } from '../../content/schemas';
import { getNextStop, isUnlocked, sortByOrder } from '../../content/selectors';
import { t, type MessageKey } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { useProgress } from '../../store/progress';
import styles from './TimelinePage.module.css';

type Status = 'completed' | 'visited' | 'next' | 'open' | 'locked';
const STATUS: Record<Status, MessageKey> = {
  completed: 'timelinePage.completed',
  visited: 'timelinePage.visited',
  next: 'timelinePage.next',
  open: 'timelinePage.open',
  locked: 'timelinePage.locked',
};

function Filter<V extends string>(props: {
  label: string;
  value: V | 'all';
  options: readonly V[];
  name: (v: V) => string;
  onChange: (v: V | 'all') => void;
}) {
  return (
    <div className={styles.filter} role="group" aria-label={props.label}>
      <span className={styles.filterLabel} aria-hidden="true">
        {props.label}
      </span>
      {(['all', ...props.options] as (V | 'all')[]).map((option) => (
        <button
          key={option}
          type="button"
          className={styles.filterButton}
          aria-pressed={props.value === option}
          onClick={() => props.onChange(option)}
        >
          {option === 'all' ? t('timelinePage.all') : props.name(option)}
        </button>
      ))}
    </div>
  );
}

/**
 * /timeline (FR-88): every stop in date order — picture, date, place then and today, status
 * and stamp — filterable by theme and region. A plain list, so it reads well with a keyboard
 * and a screen reader.
 */
export default function TimelinePage() {
  const { stops, content } = useRootData();
  const { completed, visited, stamps, mode } = useProgress();
  const [theme, setTheme] = useState<Theme | 'all'>('all');
  const [region, setRegion] = useState<RegionId | 'all'>('all');
  const next = getNextStop(stops, { completed });
  const regionLabel = (id: RegionId) => content.regions.find((r) => r.id === id)?.label ?? id;

  const statusOf = (id: string, open: boolean): Status =>
    completed.includes(id)
      ? 'completed'
      : visited.includes(id)
        ? 'visited'
        : next?.id === id
          ? 'next'
          : open
            ? 'open'
            : 'locked';

  const shown = sortByOrder(stops).filter(
    (s) => (theme === 'all' || s.theme === theme) && (region === 'all' || s.region === region),
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('timelinePage.title')}</h1>
      <Panel className={styles.filters}>
        <Filter
          label={t('timelinePage.theme')}
          value={theme}
          options={THEMES}
          name={(v) => t(`themes.${v}`)}
          onChange={setTheme}
        />
        <Filter
          label={t('timelinePage.region')}
          value={region}
          options={REGION_IDS}
          name={regionLabel}
          onChange={setRegion}
        />
      </Panel>
      <p className={styles.count} role="status">
        {t('timelinePage.count', { n: shown.length, total: stops.length })}
      </p>
      <ol className={styles.list}>
        {shown.map((stop) => {
          const open = stop.status !== 'outline' && isUnlocked(stop, stops, { completed }, mode);
          const status = statusOf(stop.id, open);
          const stamp = stamps.includes(stop.id) ? stop.rewards.stamp.icon : null;
          return (
            <li key={stop.id} className={styles.item}>
              <span className={styles.year}>{stop.dateLabel}</span>
              {stop.scene.image ? (
                <img
                  className={`pix ${styles.thumb}`}
                  src={asset(stop.scene.image)}
                  alt=""
                  width={96}
                  height={54}
                />
              ) : (
                <span className={styles.thumb} />
              )}
              <div className={styles.body}>
                <h2 className={styles.name}>
                  {open ? <Link to={`/stop/${stop.id}`}>{stop.title}</Link> : stop.title}
                </h2>
                <p className={styles.place}>
                  {t('timelinePage.place', { then: stop.place.then, today: stop.place.today })}
                </p>
                <div className={styles.meta}>
                  <Chip theme={stop.theme} />
                  <span className={styles[status]}>{t(STATUS[status])}</span>
                </div>
              </div>
              {stamp ? (
                <img
                  className={`pix ${styles.stamp}`}
                  src={asset(stamp)}
                  alt={t('timelinePage.stamp')}
                  width={52}
                  height={52}
                />
              ) : (
                <span className={styles.noStamp} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
