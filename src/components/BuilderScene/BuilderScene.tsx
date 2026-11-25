import type { ReactNode } from 'react';
import { BUILDER_PROJECTS } from '../../content/constants';
import type { BuilderProject } from '../../content/schemas';
import { PLOTS, SCENE } from '../../features/builder/builderModel';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import WoodFrame from '../WoodFrame/WoodFrame';
import styles from './BuilderScene.module.css';

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

interface BuilderSceneProps {
  built: Record<BuilderProject, boolean>;
  travellerSprite?: string;
  /** Title box, project count and the completion banner. */
  children: ReactNode;
}

/** The top-down Dapitan scene with a building, or an empty plot with a sign, for each project. */
export default function BuilderScene({ built, travellerSprite, children }: BuilderSceneProps) {
  return (
    <WoodFrame>
      <div className={styles.scene}>
        <img
          className={`pix ${styles.ground}`}
          src={asset('/assets/builder/dapitan_topdown.png')}
          alt={t('builder.sceneAlt')}
        />
        {BUILDER_PROJECTS.map((project) => {
          const plot = PLOTS[project];
          const box = {
            left: pct(plot.x, SCENE.w),
            bottom: pct(SCENE.h - plot.bottom, SCENE.h),
            width: pct(plot.w, SCENE.w),
            height: pct(plot.h, SCENE.h),
          };
          return built[project] ? (
            <img
              key={project}
              className={`pix ${styles.building}`}
              src={asset(`/assets/builder/${project}.png`)}
              alt={t(`builder.${project}`)}
              style={box}
            />
          ) : (
            <span
              key={project}
              className={styles.plot}
              style={box}
              role="img"
              aria-label={t('builder.emptyPlot', {
                project: t(`builder.${project}`).toLowerCase(),
              })}
            >
              <img
                className={`pix ${styles.sign}`}
                src={asset('/assets/builder/sign.png')}
                alt=""
              />
            </span>
          );
        })}
        {travellerSprite && (
          <img className={`pix ${styles.traveller}`} src={asset(travellerSprite)} alt="" />
        )}
        {children}
      </div>
    </WoodFrame>
  );
}
