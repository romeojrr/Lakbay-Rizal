import type { CSSProperties } from 'react';
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
  year: number;
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
}

/** With the text box over the bottom ~40 % of the scene, the open area is centred here. */
const COVERED_FOCUS_Y = 35;

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
}: SceneViewProps) {
  const view = cameraView(camera, covered ? COVERED_FOCUS_Y : 50);
  const bubble = bubbleAt ? onScreen(view, bubbleAt) : undefined;
  const cameraStyle: CSSProperties = {
    transform: `translate(${view.tx}%, ${view.ty}%) scale(${view.zoom})`,
  };
  return (
    <WoodFrame>
      <div className={`skeleton ${styles.scene}`} data-guide="scene">
        <div
          // With reduced motion, a new framing fades in instead of panning (keyed to restart).
          key={still ? `${view.tx}:${view.ty}:${view.zoom}` : undefined}
          className={cx(styles.camera, still ? 'motion-fade' : styles.pan)}
          style={cameraStyle}
          data-zoom={view.zoom}
        >
          <img className={`pix ${styles.image}`} src={asset(scene.image)} alt={scene.alt} />
        </div>
        <Ambient kind={ambient} />
        <h1 className={styles.badge}>{t('stop.badge', { place, year })}</h1>
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
    </WoodFrame>
  );
}
