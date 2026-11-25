import { useRootData } from '../../app/useRootData';
import Panel from '../../components/Panel/Panel';
import type { Source } from '../../content/schemas';
import { t, type MessageKey } from '../../i18n/t';
import styles from './CreditsPage.module.css';

const TIERS: { tier: Source['tier']; title: MessageKey }[] = [
  { tier: 1, title: 'credits.tier1' },
  { tier: 2, title: 'credits.tier2' },
  { tier: 3, title: 'credits.tier3' },
];

/** /credits — team, art, fonts, map data and every source in content (FR-72). */
export default function CreditsPage() {
  const { content } = useRootData();
  const byCitation = (a: Source, b: Source) => a.citation.localeCompare(b.citation);

  return (
    <Panel className={styles.panel}>
      <h1 className={styles.title}>{t('credits.title')}</h1>

      <section aria-labelledby="credits-team">
        <h2 id="credits-team" className={styles.heading}>
          {t('credits.team')}
        </h2>
        <p className={styles.toWrite}>{t('credits.teamToWrite')}</p>
      </section>

      <section aria-labelledby="credits-art">
        <h2 id="credits-art" className={styles.heading}>
          {t('credits.art')}
        </h2>
        <p>{t('credits.artText')}</p>
        <h2 className={styles.heading}>{t('credits.fonts')}</h2>
        <p>{t('credits.fontsText')}</p>
        <h2 className={styles.heading}>{t('credits.maps')}</h2>
        <p>{t('credits.mapsText')}</p>
      </section>

      <section aria-labelledby="credits-sources">
        <h2 id="credits-sources" className={styles.heading}>
          {t('credits.sources')}
        </h2>
        <p>{t('credits.sourcesIntro')}</p>
        {TIERS.map(({ tier, title }) => {
          const list = content.sources.filter((s) => s.tier === tier).sort(byCitation);
          if (list.length === 0) return null;
          return (
            <div key={tier}>
              <h3 className={styles.subheading}>{t(title)}</h3>
              <ul className={styles.sources}>
                {list.map((source) => (
                  <li key={source.id} className={styles.source}>
                    {source.citation}
                    {source.urls[0] && (
                      <>
                        {' '}
                        <a href={source.urls[0]} target="_blank" rel="noopener noreferrer">
                          {t('credits.readOnline')}
                          <span className="visually-hidden"> {t('stop.newTab')}</span>
                        </a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </Panel>
  );
}
