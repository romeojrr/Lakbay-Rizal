import { useEffect, useState } from 'react';
import { useRootData } from '../../app/useRootData';
import BackLink from '../../components/BackLink/BackLink';
import Panel from '../../components/Panel/Panel';
import { rankFor } from '../../game/rules';
import { getActiveLanguage, t } from '../../i18n/t';
import { asset } from '../../lib/asset';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import styles from './CertificatePage.module.css';

/** The stops with a quiz: earning all their stamps earns the certificate (§3.8). */
export function quizStopIds(stops: readonly { id: string; quiz: unknown[] }[]): string[] {
  return stops.filter((s) => s.quiz.length > 0).map((s) => s.id);
}

/**
 * /certificate (SRS v2.3 §3.8, FR-87): the player's name (kept on this device only), rank,
 * gold and silver stamps, the date and the logo, on one printed page (A4 or Letter) through
 * the browser's print dialog, where "Save as PDF" also works.
 */
export default function CertificatePage() {
  const { stops, gamification } = useRootData();
  const { completed, stampGrade, xp, certificateName } = useProgress();
  const [name, setName] = useState(certificateName ?? '');
  const quizStops = quizStopIds(stops);
  const earned = quizStops.every((id) => completed.includes(id));
  const dirty = name.trim() !== (certificateName ?? '');

  // §3.9: typing a name not saved yet is one of the two times leaving warns.
  useEffect(() => {
    useUi.getState().setUnsaved(dirty);
    return () => useUi.getState().setUnsaved(false);
  }, [dirty]);

  const saveName = () => useProgress.setState({ certificateName: name.trim() });
  const grades = quizStops.map((id) => stampGrade[id]);
  const gold = grades.filter((g) => g === 'gold').length;
  const silver = quizStops.length - gold;
  const date = new Date().toLocaleDateString(getActiveLanguage() === 'fil' ? 'fil-PH' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (!earned) {
    return (
      <Panel className={styles.notice}>
        <h1 className={styles.noticeTitle}>{t('certificate.title')}</h1>
        <p>{t('certificate.notYet', { n: quizStops.length })}</p>
        <BackLink fallback="/passport" label={t('certificate.back')} />
      </Panel>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.controls} data-no-print="">
        <BackLink fallback="/passport" label={t('certificate.back')} />
        <label className={styles.nameField}>
          <span>{t('certificate.name')}</span>
          <input
            value={name}
            maxLength={60}
            placeholder={t('certificate.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
          />
          <span className={styles.help}>{t('certificate.nameHelp')}</span>
        </label>
        <button
          type="button"
          className={styles.print}
          onClick={() => {
            saveName();
            window.print();
          }}
        >
          {t('certificate.print')}
        </button>
      </div>

      <article className={styles.certificate} aria-labelledby="certificate-title">
        <img
          className={`pix ${styles.logo}`}
          src={asset('assets/sprites/rizal_adult_suit.png')}
          alt=""
          width={68}
          height={156}
        />
        <h1 id="certificate-title" className={styles.heading}>
          {t('certificate.title')}
        </h1>
        <p>{t('certificate.intro')}</p>
        <p className={styles.player}>{name.trim() || '__________________'}</p>
        <p>{t('certificate.journey')}</p>
        <p>{t('certificate.rank', { rank: rankFor(xp, gamification.ranks).title })}</p>
        <p>{t('certificate.stamps', { gold, silver })}</p>
        <p>{t('certificate.date', { date })}</p>
        <p className={styles.brand}>{t('app.logo')}</p>
      </article>
    </div>
  );
}
