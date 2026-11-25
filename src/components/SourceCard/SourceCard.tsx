import { useState } from 'react';
import type { Source, Stop } from '../../content/schemas';
import { t } from '../../i18n/t';
import Panel from '../Panel/Panel';
import styles from './SourceCard.module.css';

const SHOWN_AT_FIRST = 2;

interface SourceCardProps {
  refs: Stop['sources'];
  sources: Source[];
}

/** Full citations with page numbers or chapters, from content (FR-32). */
export default function SourceCard({ refs, sources }: SourceCardProps) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? refs : refs.slice(0, SHOWN_AT_FIRST);

  return (
    <Panel className={styles.card} aria-labelledby="sources-title" data-guide="sources-card">
      <h2 id="sources-title" className={styles.title}>
        {t('stop.sources')}
      </h2>
      {refs.length === 0 ? (
        <p className={styles.missing}>{t('stop.sourceNeeded')}</p>
      ) : (
        <ol id="source-list" className={styles.list}>
          {shown.map((ref) => {
            const source = sources.find((s) => s.id === ref.sourceId);
            const url = source?.urls[0];
            return (
              <li key={ref.sourceId} className={styles.item}>
                <p className={styles.citation}>{source?.citation ?? ref.sourceId}</p>
                {ref.pages && (
                  <p className={styles.detail}>{t('stop.pages', { pages: ref.pages })}</p>
                )}
                {ref.chapter && <p className={styles.detail}>{ref.chapter}</p>}
                {url && (
                  <a className={styles.link} href={url} target="_blank" rel="noopener noreferrer">
                    {t('stop.readOnline')}
                    <span className="visually-hidden"> {t('stop.newTab')}</span>
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {refs.length > SHOWN_AT_FIRST && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={showAll}
          aria-controls="source-list"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? t('stop.showFewerSources') : t('stop.showAllSources', { count: refs.length })}
        </button>
      )}
    </Panel>
  );
}
