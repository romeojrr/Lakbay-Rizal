import { MATERIALS } from '../../content/constants';
import type { Builder, BuilderProject, Material } from '../../content/schemas';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: BuilderProject;
  builder: Builder;
  built: boolean;
  missing: { material: Material; missing: number }[];
  onBuild: () => void;
}

/** One town project with its cost and Build button, "Built ✓" or "Need more" (SRS §3.5). */
export default function ProjectCard({
  project,
  builder,
  built,
  missing,
  onBuild,
}: ProjectCardProps) {
  const name = t(`builder.${project}`);
  const cost = MATERIALS.flatMap((m) => {
    const amount = builder.projects[project].cost[m];
    return amount ? [t('builder.cost', { amount, material: t(`materials.${m}`) })] : [];
  });

  return (
    <li className={cx(styles.card, built && styles.built)}>
      <span className={styles.thumb}>
        <img className="pix" src={asset(`/assets/builder/${project}.png`)} alt="" />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        <span className={styles.cost}>
          {built ? t('builder.done') : cost.length ? cost.join(' · ') : t('builder.noCost')}
        </span>
      </span>
      {built ? (
        <span className={styles.done}>{t('builder.built')}</span>
      ) : missing.length === 0 ? (
        <button
          type="button"
          className={styles.build}
          aria-label={t('builder.buildProject', { project: name })}
          onClick={onBuild}
        >
          {t('builder.build')}
        </button>
      ) : (
        <span className={styles.short}>
          {t('builder.needMore')}
          <span className="visually-hidden">
            {': '}
            {t('builder.needDetail', {
              list: missing
                .map((m) =>
                  t('builder.need', { amount: m.missing, material: t(`materials.${m.material}`) }),
                )
                .join(', '),
            })}
          </span>
        </span>
      )}
    </li>
  );
}
