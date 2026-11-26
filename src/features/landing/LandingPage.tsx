import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import LanguageSwitch from '../../components/LanguageSwitch/LanguageSwitch';
import { getNextStop } from '../../content/selectors';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { play } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import styles from './Landing.module.css';
import { flyFrames, worldPoint } from './world';
import WorldView from './WorldView';

const FLY_MS = 2600;
const FADE_MS = 300;
const STILL_FADE_MS = 200;
const ZOOM = 10;

/**
 * U9 landing ("/"): the whole world with Rizal's route and a welcome card (Rizal stands inside
 * it). "Begin the journey" flies the camera down to the player's next stop (Calamba on a first
 * visit), then opens that region's map. Esc, a click or Skip lands at once; with reduced motion
 * it is a short fade. "Continue" goes straight to the map for players with saved progress.
 */
export default function LandingPage() {
  const { stops, content } = useRootData();
  const completed = useProgress((s) => s.completed);
  const started = useProgress((s) => s.visited.length > 0 || s.completed.length > 0);
  const sound = useProgress((s) => s.settings.sound);
  const setSettings = useProgress((s) => s.setSettings);
  const navigate = useNavigate();
  const still = useReducedMotion();
  const cameraRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [phase, setPhase] = useState<'world' | 'flying' | 'landing'>('world');
  const target = getNextStop(stops, { completed }) ?? stops[0];

  // Owner, 2026-11-26: every "Begin the journey" starts Rizal's tour on the map.
  const land = useCallback(() => {
    animation.current?.cancel();
    useUi.getState().startTour();
    navigate(target ? `/region/${target.region}` : '/map');
  }, [navigate, target]);

  const fadeThenLand = useCallback(
    (ms: number) => {
      setPhase('landing');
      const fade = rootRef.current?.animate?.([{ opacity: 1 }, { opacity: 0 }], {
        duration: ms,
        fill: 'forwards',
      });
      if (fade) fade.onfinish = land;
      else land();
    },
    [land],
  );

  const begin = () => {
    if (!target) return navigate('/map');
    play('whoosh');
    const camera = cameraRef.current;
    if (still || !camera || typeof camera.animate !== 'function')
      return fadeThenLand(STILL_FADE_MS);
    setPhase('flying');
    const box = camera.getBoundingClientRect();
    const view = { width: window.innerWidth, height: window.innerHeight };
    const point = worldPoint(target.place.lat, target.place.lon);
    const fly = flyFrames(box, point, view, ZOOM);
    camera.style.transformOrigin = fly.origin;
    animation.current = camera.animate(fly.frames, {
      duration: FLY_MS,
      easing: 'linear', // the frames carry the easing
      fill: 'forwards',
    });
    animation.current.onfinish = () => fadeThenLand(FADE_MS);
  };

  // Skip: Esc, a click anywhere, or the Skip button lands at once.
  useEffect(() => {
    if (phase !== 'flying') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && land();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, land]);

  const years = stops.length > 0 ? [stops[0]?.year, stops.at(-1)?.year] : null;
  const regionCount = new Set(stops.map((s) => s.region)).size;

  return (
    <div
      ref={rootRef}
      className={styles.landing}
      onClick={phase === 'flying' ? land : undefined}
      role="presentation"
    >
      <WorldView
        ref={cameraRef}
        stops={stops}
        regions={content.regions}
        leaving={phase !== 'world'}
      />

      {phase === 'world' ? (
        <div className={styles.stage}>
          <section className={styles.card} aria-labelledby="landing-title">
            <span className={styles.corners} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <div className={styles.portrait} aria-hidden="true">
              <span className={styles.sun} />
              <img
                className={`pix ${styles.rizal}`}
                src={asset('assets/sprites/rizal_adult_suit.png')}
                alt=""
                width={102}
                height={234}
              />
              <span className={styles.ground} />
            </div>
            <div className={styles.text}>
              <h1 id="landing-title" className={styles.heading}>
                <span className={styles.welcome}>{t('landing.welcome')}</span>{' '}
                <span className={styles.title}>{t('app.logo')}</span>
              </h1>
              <p className={styles.divider} aria-hidden="true">
                <span />
              </p>
              <p className={styles.tagline}>{t('landing.tagline')}</p>
              {years ? (
                <dl className={styles.stats}>
                  <div className={styles.stat}>
                    <dt>{t('landing.statYears')}</dt>
                    <dd>
                      {years[0]} – {years[1]}
                    </dd>
                  </div>
                  <div className={styles.stat}>
                    <dt>{t('landing.statStops')}</dt>
                    <dd>{stops.length}</dd>
                  </div>
                  <div className={styles.stat}>
                    <dt>{t('landing.statRegions')}</dt>
                    <dd>{regionCount}</dd>
                  </div>
                </dl>
              ) : (
                <p className={styles.soon}>{t('map.comingSoonTitle')}</p>
              )}
              <div className={styles.actions}>
                <button type="button" className={styles.start} onClick={begin}>
                  {t('landing.start')} ▶
                </button>
                {started && target && (
                  <Link className={styles.continue} to="/map">
                    {t('landing.continue', { place: target.place.label, year: target.year })}
                  </Link>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <>
          <div className={styles.burst} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`${styles.burstCloud} ${styles[`burst${i}`]}`} />
            ))}
          </div>
          {target && (
            <p className={`pixel ${styles.banner}`} role="status">
              {t('landing.heading', { place: target.place.label, year: target.year })}
            </p>
          )}
          <button
            type="button"
            className={styles.skip}
            onClick={(e) => {
              e.stopPropagation();
              land();
            }}
          >
            {t('landing.skip')}
          </button>
        </>
      )}

      <div className={styles.bar}>
        <button
          type="button"
          className={styles.sound}
          aria-pressed={sound}
          onClick={() => setSettings({ sound: !sound, music: !sound })}
        >
          {sound ? '♪' : '✕'} {t('landing.sound')}
        </button>
        <LanguageSwitch />
      </div>
    </div>
  );
}
