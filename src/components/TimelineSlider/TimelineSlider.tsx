import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { clampYear, TIMELINE_END, TIMELINE_START } from '../../features/map/mapModel';
import { t, type MessageKey } from '../../i18n/t';
import Panel from '../Panel/Panel';
import styles from './TimelineSlider.module.css';

// Era labels on the track (SRS §3.4).
const ERAS: { year: number; key?: MessageKey }[] = [
  { year: 1861, key: 'timeline.childhood' },
  { year: 1872, key: 'timeline.school' },
  { year: 1882, key: 'timeline.europe' },
  { year: 1892, key: 'timeline.exile' },
  { year: 1896 },
];

const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  PageDown: -5,
  PageUp: 5,
};

const percent = (year: number) => ((year - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;

interface TimelineSliderProps {
  value: number;
  onChange: (year: number) => void;
}

/** Year slider, 1861–1896 (FR-20). Arrows ±1 year, PageUp/PageDown ±5, Home/End. */
export default function TimelineSlider({ value, onChange }: TimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const change = (year: number) => {
    const next = clampYear(year);
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = KEY_STEPS[event.key];
    if (step !== undefined) change(value + step);
    else if (event.key === 'Home') change(TIMELINE_START);
    else if (event.key === 'End') change(TIMELINE_END);
    else return;
    event.preventDefault();
  };

  const yearAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return value;
    const ratio = (clientX - rect.left) / rect.width;
    return TIMELINE_START + ratio * (TIMELINE_END - TIMELINE_START);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    thumbRef.current?.focus();
    change(yearAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) change(yearAt(event.clientX));
  };

  return (
    <Panel className={styles.panel} aria-labelledby="timeline-title">
      <div className={styles.head}>
        <h2 id="timeline-title" className={styles.title}>
          {t('timeline.title')}
        </h2>
        <span className={styles.hint}>{t('timeline.hint')}</span>
      </div>
      <div className={styles.hit} onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
        <div ref={trackRef} className={styles.track}>
          <div className={styles.fill} style={{ width: `${percent(value)}%` }} />
          {ERAS.slice(1, -1).map((era) => (
            <span
              key={era.year}
              className={styles.tick}
              style={{ left: `${percent(era.year)}%` }}
            />
          ))}
          <div
            ref={thumbRef}
            role="slider"
            tabIndex={0}
            aria-label={t('timeline.label')}
            aria-valuemin={TIMELINE_START}
            aria-valuemax={TIMELINE_END}
            aria-valuenow={value}
            className={styles.thumb}
            style={{ left: `calc(${percent(value)}% - 14px)` }}
            onKeyDown={onKeyDown}
          >
            <span className={styles.value} aria-hidden="true">
              {value}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.eras}>
        {ERAS.map((era) => (
          <span key={era.year}>
            {era.year}
            {era.key && ` · ${t(era.key)}`}
          </span>
        ))}
      </div>
    </Panel>
  );
}
