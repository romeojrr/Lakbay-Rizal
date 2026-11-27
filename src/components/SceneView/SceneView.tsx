import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import WoodFrame from '../WoodFrame/WoodFrame';
import Ambient, { type AmbientKind } from './Ambient';
import { cameraView, onScreen, type Camera } from './camera';
import styles from './SceneView.module.css';

interface SceneViewProps {
  scene: { image: string; alt: string };
  place: string;
  /** null: the badge shows the place alone (a picture with no single year). */
  year: number | null;
  /** v2.3 §3.6: the chapter's framing. Leave out for the whole scene. */
  camera?: Camera;
  /** Scene point (in %) of the speaker; shows the "…" bubble there (FR-34). */
  bubbleAt?: { x: number; y: number };
  /** Changes when the bubble belongs to a new line, so it pops in again. */
  bubbleKey?: string;
  /** Reduced motion: the camera cuts with a short fade instead of panning (§5.6). */
  still?: boolean;
  /** The text box covers the bottom of the scene: frame the camera's point above it. */
  covered?: boolean;
  /** §5.6 ambient effect over the scene (rain, petals, …). */
  ambient?: AmbientKind;
  /**
   * Fill the parent's height (the same frame as the region maps) and show `children` (the
   * dialogue box) inside the frame, over the bottom of the scene.
   */
  fill?: boolean;
  children?: ReactNode;
  /** Replaces the "Place · year" heading (the Scenes page shows its own badges). */
  badge?: ReactNode;
  /** An arrow button left of the "Place · year" badge, back to this page (the region map). */
  back?: { to: string; label: string };
}

/** A change of picture (another place in the story) cross-fades over this long. */
export const SCENE_FADE_MS = 1200;

/** With the text box over the bottom ~40 % of the scene, the open area is centred here. */
const COVERED_FOCUS_Y = 35;
const RATIO = 16 / 9;
/** How far the scene reaches under the top of the dialogue box, in px. */
const TUCK = 24;

/** Room kept for the dialogue box: about a third of the frame, within 250–330 px. */
export function textRoom(frameHeight: number) {
  return Math.round(Math.min(330, Math.max(250, frameHeight * 0.34)));
}

interface Fit {
  width: number;
  height: number;
  left: number;
  top: number;
  room?: number;
}

/**
 * Where the 16:9 picture goes in a `w` × `h` frame whose bottom `room` px hold the text box:
 * it covers the space above the box (plus a small tuck under it), keeps its bottom (the
 * ground and the people) and loses some sky or sides when the shapes differ.
 */
export function fitScene(w: number, h: number, room: number): Fit {
  const open = Math.min(h, h - room + (room > 0 ? TUCK : 0));
  const width = Math.max(w, open * RATIO);
  const height = width / RATIO;
  return { width, height, left: (w - width) / 2, top: open - height };
}

/** The stop's 16:9 pixel scene in a wooden frame, with the place · year badge (FR-30). */
export default function SceneView({
  scene,
  place,
  year,
  camera,
  bubbleAt,
  bubbleKey,
  still,
  covered,
  ambient,
  fill,
  children,
  badge,
  back,
}: SceneViewProps) {
  const view = cameraView(camera, covered ? COVERED_FOCUS_Y : 50);
  const bubble = bubbleAt ? onScreen(view, bubbleAt) : undefined;
  const cameraStyle: CSSProperties = {
    transform: `translate(${view.tx}%, ${view.ty}%) scale(${view.zoom})`,
  };
  const sceneRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | undefined>(undefined);
  // v2.4: when the picture changes (the story moves to another place), the old one stays under
  // the new one while it fades in. With reduced motion the new picture simply replaces it.
  const [pictures, setPictures] = useState<{ now: string; before: string | null }>({
    now: scene.image,
    before: null,
  });
  if (pictures.now !== scene.image) {
    setPictures({ now: scene.image, before: still ? null : pictures.now });
  }
  useEffect(() => {
    if (!pictures.before) return;
    const timer = window.setTimeout(
      () => setPictures((p) => ({ ...p, before: null })),
      SCENE_FADE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pictures.before]);

  // Size the picture to the frame. The text box's room depends on the frame only, not on the
  // box's height, so the picture does not jump between steps.
  const hasText = Boolean(children);
  useLayoutEffect(() => {
    const el = sceneRef.current;
    if (!fill || !el) return;
    const measure = () => {
      if (el.clientWidth === 0) return;
      const room = hasText ? textRoom(el.clientHeight) : 0;
      const next = { ...fitScene(el.clientWidth, el.clientHeight, room), room };
      setFit((prev) =>
        prev &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.room === next.room
          ? prev
          : next,
      );
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fill, hasText]);

  const layerStyle: CSSProperties | undefined = fill
    ? fit
      ? { width: fit.width, height: fit.height, left: fit.left, top: fit.top }
      : { width: '100%', top: 0, left: 0 }
    : undefined;

  // The badge names the place on screen; it fades over when the story moves elsewhere.
  const heading = (
    <h1 key={place} className={cx(styles.badge, pictures.before && styles.badgeIn)}>
      {year === null ? place : t('stop.badge', { place, year })}
    </h1>
  );

  return (
    <WoodFrame className={cx(fill && styles.fillWood)}>
      <div
        ref={sceneRef}
        className={cx('skeleton', styles.scene, fill && styles.fill)}
        data-guide="scene"
      >
        <div className={cx(styles.layer, fill && styles.layerFill)} style={layerStyle}>
          <div
            // With reduced motion, a new framing fades in instead of panning (keyed to restart).
            key={still ? `${view.tx}:${view.ty}:${view.zoom}` : undefined}
            className={cx(styles.camera, still ? 'motion-fade' : styles.pan)}
            style={cameraStyle}
            data-zoom={view.zoom}
          >
            {pictures.before && (
              <img
                className={`pix ${styles.image} ${styles.before}`}
                src={asset(pictures.before)}
                alt=""
                aria-hidden="true"
              />
            )}
            <img
              key={scene.image}
              className={cx('pix', styles.image, pictures.before && styles.fadeIn)}
              src={asset(scene.image)}
              alt={scene.alt}
            />
          </div>
          <Ambient kind={ambient} />
          {bubble && bubble.x >= 0 && bubble.x <= 100 && bubble.y >= 0 && bubble.y <= 100 && (
            <span
              key={bubbleKey}
              className={styles.bubble}
              style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
              aria-hidden="true"
            >
              <span className={styles.bob}>…</span>
            </span>
          )}
        </div>
        {back ? (
          // Owner, 2026-11-26: an arrow back to the map, left of the place on every stop.
          <div className={styles.corner}>
            <Link className={styles.back} to={back.to} aria-label={back.label} title={back.label}>
              <span aria-hidden="true">◀</span>
            </Link>
            {badge ?? heading}
          </div>
        ) : (
          (badge ?? heading)
        )}
        {fill && children && (
          <div
            className={styles.text}
            style={{ '--text-room': `${fit?.room ?? 250}px` } as CSSProperties}
          >
            {children}
          </div>
        )}
      </div>
    </WoodFrame>
  );
}
