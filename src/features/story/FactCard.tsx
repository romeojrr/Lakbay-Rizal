import { t } from '../../i18n/t';
import styles from './StoryPanel.module.css';

/** A 12 × 12 pixel lightbulb, drawn in squares (decorative). */
function Lightbulb() {
  const ink =
    'M4 0h4v1H4zM3 1h1v1H3zM8 1h1v1H8zM2 2h1v4H2zM9 2h1v4H9zM3 6h1v2H3zM8 6h1v2H8zM4 8h4v1H4zM4 10h4v1H4zM5 11h2v1H5z';
  return (
    <svg className={styles.bulb} viewBox="0 0 12 12" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M4 1h4v1h1v4H8v2H4V6H3V2h1z" fill="var(--gold)" />
      <path d={ink} fill="var(--ink)" />
      <path d="M4 9h4v1H4z" fill="var(--muted)" />
    </svg>
  );
}

/** SRS v2.3 §3.6: "Did you know?" with a lightbulb, the fact and its source's short title. */
export default function FactCard({ text, source }: { text: string; source: string }) {
  return (
    <div className={styles.fact}>
      <Lightbulb />
      <div className={styles.factBody}>
        <h3 className={styles.factTitle}>{t('stop.didYouKnow')}</h3>
        <p className={styles.factText}>{text}</p>
        <p className={styles.source}>{t('stop.source', { title: source })}</p>
      </div>
    </div>
  );
}
