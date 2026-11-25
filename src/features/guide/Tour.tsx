import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import { t } from '../../i18n/t';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import { buildSteps } from '../story/steps';
import CloseUpPortrait from '../story/CloseUpPortrait';
import styles from './Tour.module.css';
import { useTourTarget } from './useTourTarget';

/** '/' means any map page (the home page opens a region). */
const onRoute = (route: string, path: string) =>
  route === '/' ? path === '/' || path.startsWith('/region/') : path === route;

const CARD_GAP = 14;

/**
 * SRS v2.3 §3.7 the tour: the page dims, a spotlight opens around the element named by the
 * step's `target`, and Rizal (portrait, mood from the step) explains it. Next / Skip tour;
 * Esc skips; focus stays in the card. "click-target" steps wait for a click on the element
 * (the card's button clicks it for keyboard users). The tour follows each step's route.
 */
export default function Tour() {
  const { guide, content, stops } = useRootData();
  const { active, step: index } = useUi((s) => s.tour);
  const { setTourStep, endTour } = useUi.getState();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const still = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const step = active ? guide.tour[index] : undefined;
  const ready = step ? onRoute(step.route, pathname) : false;
  const rizal = content.characters[guide.speaker];

  const finish = useCallback(() => {
    useProgress.setState({ tourDone: true });
    endTour();
  }, [endTour]);
  const advance = useCallback(() => {
    if (index + 1 >= guide.tour.length) finish();
    else setTourStep(index + 1);
  }, [index, guide.tour.length, finish, setTourStep]);

  // The story only shows a line tag while a line is on screen: move it to the first line.
  const stopId = /^\/stop\/([^/]+)$/.exec(pathname)?.[1];
  const prepare = useCallback(() => {
    if (step?.target !== 'line-tag' || !stopId) return;
    const stop = stops.find((s) => s.id === stopId);
    const first = stop ? buildSteps(stop.chapters).findIndex((s) => s.kind === 'line') : -1;
    if (first >= 0) useUi.getState().setStoryStep(stopId, first);
  }, [step?.target, stopId, stops]);
  const { element, box, searching } = useTourTarget(
    ready ? (step?.target ?? null) : null,
    `${index}:${pathname}`,
    prepare,
  );

  // Go where the step happens.
  useEffect(() => {
    if (step && !ready) navigate(step.route);
  }, [step, ready, navigate]);

  // "click-target": the player's own click on the element moves the tour on.
  useEffect(() => {
    if (!element || step?.next !== 'click-target') return;
    const onClick = () => window.setTimeout(advance, 0);
    element.addEventListener('click', onClick);
    return () => element.removeEventListener('click', onClick);
  }, [element, step?.next, advance]);

  // Esc skips; focus starts on the card for each step.
  useEffect(() => {
    if (!step) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return finish();
      if (event.key !== 'Tab' || !cardRef.current) return;
      // Focus stays in the card.
      const items = [...cardRef.current.querySelectorAll<HTMLElement>('button')];
      const first = items[0];
      const last = items.at(-1);
      const inside = cardRef.current.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, finish]);
  useEffect(() => {
    if (step && ready && !searching) cardRef.current?.focus({ preventScroll: true });
  }, [step, ready, searching, index]);

  if (!step || !ready || searching || stopId === stops.at(-1)?.id) return null;

  const isLast = index === guide.tour.length - 1;
  const clickStep = step.next === 'click-target' && element;
  const cardStyle: CSSProperties = {};
  if (box) {
    const below = box.top + box.height / 2 < window.innerHeight * 0.55;
    cardStyle.left = Math.max(12, Math.min(box.left, window.innerWidth - 432));
    if (below) cardStyle.top = Math.min(box.top + box.height + CARD_GAP, window.innerHeight - 220);
    else cardStyle.bottom = Math.max(12, window.innerHeight - box.top + CARD_GAP);
  }

  return (
    <div className={styles.layer}>
      {box ? (
        <>
          {/* The page dims except for a rounded hole around the target. */}
          <svg className={styles.mask} aria-hidden="true">
            <defs>
              <mask id="tour-hole">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={box.left - 6}
                  y={box.top - 6}
                  width={box.width + 12}
                  height={box.height + 12}
                  rx={10}
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" className={styles.shade} mask="url(#tour-hole)" />
          </svg>
          <div
            className={styles.spotlight}
            style={{
              top: box.top - 6,
              left: box.left - 6,
              width: box.width + 12,
              height: box.height + 12,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className={styles.dim} aria-hidden="true" />
      )}
      {/* Button steps: the page behind cannot be used. Click steps: only the target can. */}
      {!clickStep && <div className={styles.blocker} aria-hidden="true" />}
      <div
        ref={cardRef}
        className={`${styles.card} ${box ? styles.placed : styles.centred} ${still ? 'motion-fade' : styles.rise}`}
        style={cardStyle}
        role="dialog"
        aria-modal={!clickStep}
        aria-label={t('guide.label')}
        aria-describedby="tour-text"
        tabIndex={-1}
      >
        {rizal?.portrait && (
          <CloseUpPortrait
            sheet={rizal.portrait}
            name={rizal.name}
            mood={step.mood}
            talking={false}
            still={still}
          />
        )}
        <div className={styles.body}>
          <p className={styles.count}>
            {t('guide.step', { n: index + 1, total: guide.tour.length })}
          </p>
          <p id="tour-text" className={styles.text}>
            {step.text}
          </p>
          <div className={styles.buttons}>
            <button type="button" className={styles.skip} onClick={finish}>
              {t('guide.skip')}
            </button>
            <button
              type="button"
              className={styles.next}
              onClick={() => (clickStep ? element.click() : advance())}
            >
              {clickStep ? t('guide.tryIt') : isLast ? t('guide.done') : t('guide.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
