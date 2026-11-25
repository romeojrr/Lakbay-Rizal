import Chip from '../../components/Chip/Chip';
import Panel from '../../components/Panel/Panel';
import type { Item, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import styles from './StopPage.module.css';

interface StopFactsProps {
  stop: PlayableStop;
  item: Item | undefined;
}

/** "This stop" (title, theme, then / today) and the "Item reward" card (FR-32). */
export default function StopFacts({ stop, item }: StopFactsProps) {
  return (
    <>
      <Panel className={styles.facts} aria-labelledby="this-stop-title">
        <div className={styles.factsHead}>
          <h2 id="this-stop-title" className={styles.cardTitle}>
            {t('stop.thisStop')}
          </h2>
          <Chip theme={stop.theme} />
        </div>
        <p className={styles.stopTitle}>{stop.title}</p>
        <p className={styles.dates}>{stop.dateLabel}</p>
        <dl className={styles.places}>
          <div className={styles.place}>
            <dt>{t('stop.then')}</dt>
            <dd>{stop.place.then}</dd>
          </div>
          <div className={styles.place}>
            <dt>{t('stop.today')}</dt>
            <dd>{stop.place.today}</dd>
          </div>
        </dl>
      </Panel>
      {item && (
        <Panel className={styles.item}>
          <div className={styles.itemIcon}>
            <img
              className="pix"
              src={asset(item.icon)}
              alt=""
              width={52}
              height={52}
              onError={(e) => {
                // FR-53: fall back to the stop's stamp if the item icon is missing.
                e.currentTarget.src = asset(stop.rewards.stamp.icon);
              }}
            />
          </div>
          <div className={styles.itemText}>
            <span className={styles.itemLabel}>{t('stop.itemReward')}</span>
            <span className={styles.itemName}>{item.name}</span>
          </div>
        </Panel>
      )}
    </>
  );
}
