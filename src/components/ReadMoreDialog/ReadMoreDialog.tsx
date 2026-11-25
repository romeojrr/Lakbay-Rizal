import type { PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import Dialog from '../Dialog/Dialog';
import styles from './ReadMoreDialog.module.css';

interface ReadMoreDialogProps {
  stop: PlayableStop;
  open: boolean;
  onClose: () => void;
}

/** The stop's story (100–150 words), optional longer text and the scene credit (FR-33). */
export default function ReadMoreDialog({ stop, open, onClose }: ReadMoreDialogProps) {
  const paragraphs = (text: string) =>
    text
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p, i) => <p key={i}>{p}</p>);

  return (
    <Dialog open={open} onClose={onClose} title={stop.title}>
      <p className={styles.meta}>
        {stop.place.then} · {stop.dateLabel}
      </p>
      {paragraphs(stop.story)}
      {stop.readMore && paragraphs(stop.readMore)}
      <p className={styles.credit}>{t('stop.sceneCredit', { alt: stop.scene.alt })}</p>
    </Dialog>
  );
}
