import { forwardRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MATERIALS } from '../../content/constants';
import type { Item, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import Panel from '../Panel/Panel';
import styles from './RewardCard.module.css';
import { play } from '../../lib/sound';

interface RewardCardProps {
  stop: PlayableStop;
  item: Item | undefined;
  /** False when the stop was completed before: rewards are given once (GD-4). */
  fresh: boolean;
  /** §3.8: this attempt's stamp grade. */
  grade?: 'gold' | 'silver';
}

/** Stamp + item + materials, with Open passport and Back to map (FR-43). */
const RewardCard = forwardRef<HTMLHeadingElement, RewardCardProps>(function RewardCard(
  { stop, item, fresh, grade },
  ref,
) {
  // §3.11: the stamp lands with a thud (once, when it is new).
  useEffect(() => {
    if (fresh) play('stamp');
  }, [fresh]);
  const stamp = t('reward.stamp', { place: stop.place.label });
  const materials = MATERIALS.flatMap((m) => {
    const amount = stop.rewards.materials?.[m];
    return amount ? [`+${amount} ${t(`materials.${m}`)}`] : [];
  });

  return (
    <Panel className={styles.card} aria-labelledby="reward-title">
      <div className={styles.stamp} style={{ borderColor: `var(--theme-${stop.theme})` }}>
        <img className="pix" src={asset(stop.rewards.stamp.icon)} alt="" width={48} height={48} />
      </div>
      <div className={styles.text}>
        <h2 ref={ref} id="reward-title" className={styles.title} tabIndex={-1}>
          {t('reward.title')}
        </h2>
        <p className={styles.line}>
          {item
            ? t('reward.andItem', { stamp, item: item.name })
            : t('reward.onlyStamp', { stamp })}
        </p>
        {grade && (
          <p className={grade === 'gold' ? styles.gold : styles.silver}>
            {grade === 'gold' ? t('quiz.gold') : t('quiz.silver')}
          </p>
        )}
        {materials.length > 0 && (
          <p className={styles.materials}>
            {t('reward.materials')}: {materials.join(' · ')}
          </p>
        )}
        {!fresh && <p className={styles.materials}>{t('reward.already')}</p>}
      </div>
      <div className={styles.actions}>
        <Link className={styles.primary} to="/passport">
          {t('reward.openPassport')}
        </Link>
        <Link className={styles.secondary} to={`/region/${stop.region}`}>
          {t('reward.backToMap')}
        </Link>
      </div>
    </Panel>
  );
});

export default RewardCard;
