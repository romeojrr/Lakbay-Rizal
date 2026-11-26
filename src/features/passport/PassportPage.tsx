import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import StampCard from '../../components/StampCard/StampCard';
import ThemeBadge from '../../components/ThemeBadge/ThemeBadge';
import { THEMES } from '../../content/constants';
import { getThemeProgress, isFinalStop } from '../../content/selectors';
import { t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { useProgress } from '../../store/progress';
import { AchievementsPanel, RankPanel } from './AchievementsPanel';
import styles from './PassportPage.module.css';
import PassportTabs from './PassportTabs';
import { quizStopIds } from '../certificate/CertificatePage';
import { useTip } from '../guide/TipBubble';

/** /passport — an open leather passport: traveller page and stamp page (FR-50 to FR-52). */
export default function PassportPage() {
  useTip('passport-first'); // §3.7: a one-time hint from Rizal
  const { content, stops, gamification } = useRootData();
  const grades = useProgress((s) => s.stampGrade);
  const achievements = useProgress((s) => s.achievements);
  const xp = useProgress((s) => s.xp);
  const stamps = useProgress((s) => s.stamps);
  const completed = useProgress((s) => s.completed);
  const markPassportSeen = useProgress((s) => s.markPassportSeen);
  // Show "New!" during this visit, but clear it so it is gone next time (FR-51, SRS §12).
  const [newStamp] = useState(() => useProgress.getState().newStamp);
  useEffect(() => markPassportSeen(), [markPassportSeen]);

  const playable = stops.filter((s) => s.status !== 'outline');
  const earned = new Set(stamps);
  const earnedCount = playable.filter((s) => earned.has(s.id)).length;
  const themes = getThemeProgress(stops, { completed });
  const rizal = content.characters.rizal;
  const first = playable[0];
  const percent = playable.length ? (earnedCount / playable.length) * 100 : 0;

  return (
    <div className={styles.book}>
      <section className={styles.page} aria-labelledby="traveller-title">
        <div className={styles.pageHead}>
          <h1 id="traveller-title" className={styles.title}>
            {t('passport.title')}
          </h1>
          {first && (
            <span className={styles.meta}>{t('passport.number', { number: first.year })}</span>
          )}
        </div>
        <div className={styles.traveller}>
          {rizal?.sprite && (
            <div className={styles.photo}>
              <img
                className="pix"
                src={asset(rizal.sprite)}
                alt={t('passport.portraitAlt', { name: rizal.name })}
                width={68}
                height={156}
              />
            </div>
          )}
          <dl className={styles.fields}>
            <div>
              <dt>{t('passport.name')}</dt>
              <dd>{rizal?.name}</dd>
            </div>
            {first && (
              <div>
                <dt>{t('passport.born')}</dt>
                <dd>{t('passport.bornValue', { year: first.year, place: first.place.label })}</dd>
              </div>
            )}
            <div>
              <dt>{t('passport.stamps')}</dt>
              <dd>{t('passport.stampsValue', { done: earnedCount, total: playable.length })}</dd>
            </div>
          </dl>
        </div>
        <div
          className={styles.bar}
          role="progressbar"
          aria-label={t('passport.stamps')}
          aria-valuemin={0}
          aria-valuemax={playable.length}
          aria-valuenow={earnedCount}
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <h2 className={styles.subtitle}>{t('passport.themeBadges')}</h2>
        <ul className={styles.badges}>
          {THEMES.map((theme) => (
            <ThemeBadge key={theme} theme={theme} {...themes[theme]} />
          ))}
        </ul>
        <div className={styles.links}>
          <Link className={styles.journal} to="/journal">
            {t('passport.journal')}
          </Link>
          {quizStopIds(stops).every((id) => completed.includes(id)) && (
            <Link className={styles.journal} to="/certificate">
              {t('certificate.print')}
            </Link>
          )}
        </div>
      </section>

      <section className={`${styles.page} ${styles.stampsPage}`} aria-labelledby="stamps-title">
        <PassportTabs
          heading={
            <h2 id="stamps-title" className={styles.title}>
              {t('passport.stampsTitle')}
            </h2>
          }
          panels={{
            stamps: (
              <ol className={styles.grid}>
                {playable.map((stop) => (
                  <StampCard
                    key={stop.id}
                    stop={stop}
                    earned={earned.has(stop.id)}
                    isNew={stop.id === newStamp}
                    plain={isFinalStop(stop, stops)}
                    grade={grades[stop.id]}
                  />
                ))}
              </ol>
            ),
            achievements: (
              <AchievementsPanel
                gamification={gamification}
                content={content}
                unlocked={achievements}
              />
            ),
            rank: <RankPanel gamification={gamification} xp={xp} />,
          }}
        />
      </section>
    </div>
  );
}
