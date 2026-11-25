import { useRootData } from '../../app/useRootData';
import BackLink from '../../components/BackLink/BackLink';
import Panel from '../../components/Panel/Panel';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { useProgress } from '../../store/progress';
import styles from './JournalPage.module.css';

/** /journal — collected keepsake items with their icons (FR-53). */
export default function JournalPage() {
  const { content, stops } = useRootData();
  const owned = useProgress((s) => s.items);
  const total = new Set(stops.flatMap((s) => (s.rewards.item ? [s.rewards.item] : []))).size;
  const entries = owned.flatMap((id) => {
    const item = content.items[id];
    const from = stops.find((s) => s.rewards.item === id);
    return item ? [{ id, item, fallback: from?.rewards.stamp.icon ?? null }] : [];
  });

  return (
    <div className={styles.page}>
      <div>
        <BackLink fallback="/passport" label={t('journal.backToPassport')} />
      </div>
      <Panel className={styles.panel}>
        <h1 className={styles.title}>{t('journal.title')}</h1>
        <p className={styles.intro}>
          {t('journal.intro')} {t('journal.count', { count: entries.length, total })}
        </p>
        {entries.length === 0 ? (
          <p className={styles.empty}>{t('journal.empty')}</p>
        ) : (
          <ul className={styles.list}>
            {entries.map(({ id, item, fallback }) => (
              <li key={id} className={styles.entry}>
                <span className={styles.icon}>
                  <img
                    className="pix"
                    src={asset(item.icon)}
                    alt=""
                    width={52}
                    height={52}
                    onError={(e) => {
                      // FR-53: a missing item icon falls back to the stop's stamp.
                      if (fallback) e.currentTarget.src = asset(fallback);
                    }}
                  />
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{item.name}</span>
                  <span className={styles.desc}>{item.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
