import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackLink from '../../components/BackLink/BackLink';
import BuilderScene from '../../components/BuilderScene/BuilderScene';
import Panel from '../../components/Panel/Panel';
import Portrait from '../../components/Portrait/Portrait';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import ResourceTile from '../../components/ResourceTile/ResourceTile';
import { BUILDER_PROJECTS, MATERIALS } from '../../content/constants';
import type { BuilderProject, Content, PlayableStop } from '../../content/schemas';
import { t } from '../../i18n/t';
import { useGame } from '../../game/useGame';
import { useProgress } from '../../store/progress';
import { availableMaterials, builtCount, isBuilt, isTownComplete, shortfall } from './builderModel';
import styles from './BuilderPage.module.css';
import { useTip } from '../guide/TipBubble';

interface Message {
  who: 'narrator' | 'fact';
  text: string;
}

interface BuilderRunProps {
  stop: PlayableStop;
  content: Content;
}

/** Dapitan builder: materials, projects, the town scene and a one-sentence fact per build (§3.5). */
export default function BuilderRun({ stop, content }: BuilderRunProps) {
  useTip('builder-first'); // §3.7: a one-time hint from Rizal
  const builder = content.builder;
  const progress = useProgress();
  const [message, setMessage] = useState<Message>({ who: 'narrator', text: t('builder.intro') });

  const built = Object.fromEntries(
    BUILDER_PROJECTS.map((p) => [p, isBuilt(p, builder, progress)]),
  ) as Record<BuilderProject, boolean>;
  const available = availableMaterials(builder, progress);
  const done = builtCount(builder, progress);
  const townDone = isTownComplete(builder, progress);

  const game = useGame();
  const buildProject = (project: BuilderProject) => {
    game.build(project); // §3.8: +XP per project
    const fact = builder.projects[project].fact;
    const next = { builder: { ...progress.builder, [project]: true } };
    if (isTownComplete(builder, next)) {
      progress.complete(stop); // §3.5: all three projects give the Dapitan stamp (once).
      game.check();
      setMessage({ who: 'fact', text: `${fact} ${t('builder.townComplete')}` });
    } else {
      setMessage({ who: 'fact', text: fact });
    }
  };

  const restart = () => {
    progress.resetBuilder();
    setMessage({ who: 'narrator', text: t('builder.restartDone') });
  };

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <BackLink fallback={`/stop/${stop.id}`} label={t('builder.backToStory')} />
      </div>
      <section className={styles.town} aria-label={t('builder.section')}>
        <BuilderScene built={built} travellerSprite={content.characters['rizal-dapitan']?.sprite}>
          <div className={styles.titleBox}>
            <h1 className={styles.title}>{stop.place.label}</h1>
            <span className={styles.subtitle}>
              {t('builder.subtitle', { theme: t(`themes.${stop.theme}`), dates: stop.dateLabel })}
            </span>
          </div>
          <div className={styles.count}>
            {t('builder.projectsDone', { done, total: BUILDER_PROJECTS.length })}
          </div>
        </BuilderScene>
        {townDone && (
          // Overlaps the bottom of the scene on desktop; sits below it on small screens.
          <div className={styles.banner}>
            <span className={styles.bannerText}>
              {t('builder.stampEarned', { place: stop.place.label })}
            </span>
            <Link className={styles.bannerLink} to="/passport">
              {t('builder.openPassport')}
            </Link>
          </div>
        )}
        <div className={styles.message}>
          <Portrait character={undefined} />
          <div className={styles.messageBody}>
            <span className={styles.who}>
              {message.who === 'fact' ? t('builder.didYouKnow') : t('builder.narrator')}
            </span>
            <p className={styles.text} aria-live="polite">
              {message.text}
            </p>
          </div>
        </div>
      </section>

      <aside className={styles.aside}>
        <Panel className={styles.panel} aria-labelledby="materials-title">
          <div className={styles.panelHead}>
            <h2 id="materials-title" className={styles.panelTitle}>
              {t('builder.materials')}
            </h2>
            <button type="button" className={styles.restart} onClick={restart}>
              {t('builder.restart')}
            </button>
          </div>
          <ul className={styles.tiles}>
            {MATERIALS.map((m) => (
              <ResourceTile key={m} material={m} amount={available[m]} />
            ))}
          </ul>
        </Panel>
        <Panel className={styles.panel} aria-labelledby="projects-title">
          <h2 id="projects-title" className={styles.panelTitle}>
            {t('builder.buildTitle')}
          </h2>
          <ul className={styles.projects}>
            {BUILDER_PROJECTS.map((project) => (
              <ProjectCard
                key={project}
                project={project}
                builder={builder}
                built={built[project]}
                missing={shortfall(project, builder, available)}
                onBuild={() => buildProject(project)}
              />
            ))}
          </ul>
          <p className={styles.hint}>{t('builder.earnMore')}</p>
        </Panel>
      </aside>
    </div>
  );
}
