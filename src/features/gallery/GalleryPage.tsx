import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import Panel from '../../components/Panel/Panel';
import SceneView from '../../components/SceneView/SceneView';
import type { PlayableStop } from '../../content/schemas';
import { getNextStop, isUnlocked } from '../../content/selectors';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { useWide } from '../../lib/useWide';
import { useProgress } from '../../store/progress';
import styles from './GalleryPage.module.css';
import { useTip } from '../guide/TipBubble';

/** /scenes — every scene the player has unlocked, all of them in Free mode (FR-55). */
export default function GalleryPage() {
  useTip('gallery-first'); // §3.7: a one-time hint from Rizal
  const { stops } = useRootData();
  const mode = useProgress((s) => s.mode);
  const completed = useProgress((s) => s.completed);
  const showVerify = useProgress((s) => s.settings.showVerifyNotes) || import.meta.env.DEV;
  const [params, setParams] = useSearchParams();
  const pageRef = useRef<HTMLDivElement>(null);
  const wide = useWide(pageRef);

  const scenes = stops.filter(
    (s): s is PlayableStop => s.status !== 'outline' && isUnlocked(s, stops, { completed }, mode),
  );
  const next = getNextStop(stops, { completed });
  const current =
    scenes.find((s) => s.id === params.get('stop')) ??
    scenes.find((s) => s.id === next?.id) ??
    scenes[0];

  if (!current) {
    return (
      <Panel className={styles.empty}>
        <h1 className={styles.title}>{t('gallery.title')}</h1>
        <p>{t('gallery.lockedHint')}</p>
      </Panel>
    );
  }

  const notes = current.scene.notes ?? [];
  const select = (id: string) => setParams({ stop: id }, { replace: true });

  const badges = (
    <div className={styles.badges}>
      <span className={styles.badge}>
        {t('gallery.badge', { n: current.order, place: current.place.label, year: current.year })}
      </span>
      <span className={styles.time}>{current.scene.time}</span>
    </div>
  );
  const info = (
    <>
      <h2 className={styles.sceneTitle}>{current.title}</h2>
      <p className={styles.alt}>{current.scene.alt}</p>
      <h3 className={styles.subhead}>{t('gallery.whatYouSee')}</h3>
      <ul className={styles.notes}>
        {notes.length > 0 ? (
          notes.map((note) => <li key={note}>{note}</li>)
        ) : (
          <li className={styles.toWrite}>{t('gallery.toWrite')}</li>
        )}
      </ul>
      {showVerify && current.verifyNotes && current.verifyNotes.length > 0 && (
        <div className={styles.verify}>
          <h3 className={styles.subhead}>{t('gallery.toVerify')}</h3>
          <ul className={styles.notes}>
            {current.verifyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      <Link className={styles.open} to={`/stop/${current.id}`}>
        {t('gallery.openStop')}
      </Link>
    </>
  );

  // The shared layout: the scene in the map's frame (70 %), the scene list beside it (30 %).
  return (
    <div ref={pageRef} className={styles.page}>
      <div className={styles.grid}>
        <section
          className={cx(styles.main, wide && styles.mainFill)}
          aria-label={t('gallery.scene')}
        >
          <h1 className="visually-hidden">{t('gallery.title')}</h1>
          <SceneView
            scene={current.scene}
            place={current.place.label}
            year={current.year}
            fill={wide}
            covered={wide}
            badge={badges}
          >
            {wide ? <div className={styles.infoBox}>{info}</div> : null}
          </SceneView>
          {!wide && <Panel className={styles.info}>{info}</Panel>}
        </section>

        <nav className={styles.list} aria-label={t('gallery.choose')}>
          <ul className={styles.items}>
            {scenes.map((stop) => (
              <li key={stop.id}>
                <button
                  type="button"
                  className={cx(styles.item, stop.id === current.id && styles.selected)}
                  aria-current={stop.id === current.id ? 'true' : undefined}
                  onClick={() => select(stop.id)}
                >
                  <img className={`pix ${styles.thumb}`} src={asset(stop.scene.image)} alt="" />
                  <span className={styles.itemText}>
                    <span className={styles.itemName}>
                      {t('gallery.item', { n: stop.order, place: stop.place.label })}
                    </span>
                    <span className={styles.itemMeta}>
                      {t('gallery.itemMeta', { year: stop.year, time: stop.scene.time })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
