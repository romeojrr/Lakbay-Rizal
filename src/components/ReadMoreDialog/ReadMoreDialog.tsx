import type { Source, Stop } from '../../content/schemas';
import type { StopV3 } from '../../content/schemas.v3';
import { t } from '../../i18n/t';
import Dialog from '../Dialog/Dialog';
import styles from './ReadMoreDialog.module.css';

interface ReadMoreDialogProps {
  stop: Pick<
    Stop | StopV3,
    'title' | 'story' | 'readMore' | 'place' | 'dateLabel' | 'scene' | 'sources'
  >;
  sources: Source[];
  open: boolean;
  onClose: () => void;
}

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map((p, i) => <p key={i}>{p}</p>);

/**
 * SRS v2.3 §3.6 Read more: the stop's 100–150-word summary, the place then and today, the
 * date and the full source list (FR-33).
 */
export default function ReadMoreDialog({ stop, sources, open, onClose }: ReadMoreDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={stop.title}>
      <dl className={styles.facts}>
        <div>
          <dt>{t('stop.then')}</dt>
          <dd>{stop.place.then}</dd>
        </div>
        <div>
          <dt>{t('stop.today')}</dt>
          <dd>{stop.place.today}</dd>
        </div>
        <div>
          <dt>{t('stop.date')}</dt>
          <dd>{stop.dateLabel}</dd>
        </div>
      </dl>
      {paragraphs(stop.story)}
      {stop.readMore && paragraphs(stop.readMore)}
      <h3 className={styles.heading}>{t('stop.sources')}</h3>
      <ol className={styles.sources}>
        {stop.sources.map((ref) => {
          const source = sources.find((s) => s.id === ref.sourceId);
          return (
            <li key={ref.sourceId}>
              {source?.citation ?? ref.sourceId}
              {ref.pages ? ` ${t('stop.pages', { pages: ref.pages })}` : ''}
              {ref.chapter ? ` · ${ref.chapter}` : ''}
            </li>
          );
        })}
      </ol>
      <p className={styles.credit}>{t('stop.sceneCredit', { alt: stop.scene.alt })}</p>
    </Dialog>
  );
}
