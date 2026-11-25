import { useState } from 'react';
import Dialog from '../../components/Dialog/Dialog';
import type { JourneyMode } from '../../content/selectors';
import { t, type MessageKey } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import styles from './IntroDialog.module.css';

const CARDS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'intro.card1Title', body: 'intro.card1Body' },
  { title: 'intro.card2Title', body: 'intro.card2Body' },
  { title: 'intro.card3Title', body: 'intro.card3Body' },
];

/** FR-4: three intro cards on the first visit. Skippable; not shown again unless reset. */
export default function IntroDialog() {
  const seenIntro = useProgress((s) => s.seenIntro);
  const setSeenIntro = useProgress((s) => s.setSeenIntro);
  const setMode = useProgress((s) => s.setMode);
  const [index, setIndex] = useState(0);
  const card = CARDS[index];
  if (!card) return null;

  const finish = (mode?: JourneyMode) => {
    if (mode) setMode(mode);
    setSeenIntro();
  };
  const last = index === CARDS.length - 1;

  return (
    <Dialog
      open={!seenIntro}
      onClose={() => finish()}
      title={t('intro.title')}
      closeLabel={t('intro.skip')}
    >
      <p className={styles.step}>{t('intro.step', { n: index + 1, total: CARDS.length })}</p>
      <h3 className={styles.cardTitle}>{t(card.title)}</h3>
      <p className={styles.body}>{t(card.body)}</p>
      <div className={styles.dots} aria-hidden="true">
        {CARDS.map((c, i) => (
          <span key={c.title} className={i === index ? styles.dotOn : styles.dot} />
        ))}
      </div>
      <div className={styles.actions}>
        {index > 0 && (
          <button type="button" className={styles.secondary} onClick={() => setIndex(index - 1)}>
            {t('intro.back')}
          </button>
        )}
        {last ? (
          <>
            <button type="button" className={styles.secondary} onClick={() => finish('free')}>
              {t('intro.startFree')}
            </button>
            <button type="button" className={styles.primary} onClick={() => finish('guided')}>
              {t('intro.startGuided')}
            </button>
          </>
        ) : (
          <button type="button" className={styles.primary} onClick={() => setIndex(index + 1)}>
            {t('intro.next')}
          </button>
        )}
      </div>
    </Dialog>
  );
}
