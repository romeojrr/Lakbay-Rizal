import type { PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import DramatizedTag from '../DramatizedTag/DramatizedTag';
import WoodFrame from '../WoodFrame/WoodFrame';
import styles from './SceneView.module.css';

interface SceneViewProps {
  stop: PlayableStop;
  /** Who is speaking now; shows a "…" bubble at their anchor (FR-34). */
  speaker: string | undefined;
}

/** The stop's 16:9 pixel scene in a wooden frame, with the place · year badge (FR-30). */
export default function SceneView({ stop, speaker }: SceneViewProps) {
  const anchor = speaker ? stop.scene.speakerAnchors?.[speaker] : undefined;
  return (
    <WoodFrame>
      <div className={`skeleton ${styles.scene}`} data-guide="scene">
        <img className={`pix ${styles.image}`} src={asset(stop.scene.image)} alt={stop.scene.alt} />
        <h1 className={styles.badge}>
          {t('stop.badge', { place: stop.place.label, year: stop.year })}
        </h1>
        {stop.dialogue.dramatized && (
          <div className={styles.tag}>
            <DramatizedTag />
          </div>
        )}
        {anchor && (
          <span
            key={speaker}
            className={styles.bubble}
            style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
            aria-hidden="true"
          >
            …
          </span>
        )}
      </div>
    </WoodFrame>
  );
}
