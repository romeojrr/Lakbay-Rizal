import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRootData } from '../../app/useRootData';
import { t } from '../../i18n/t';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import CloseUpPortrait from '../story/CloseUpPortrait';
import styles from './TipBubble.module.css';

const SHOW_MS = 8000;

/**
 * SRS v2.3 §3.7 tips: a one-time hint the first time a screen opens (and on rank-up, and in
 * a private window). Small portrait and bubble in a corner; hides after 8 s or on click.
 */
export function useTip(id: string, when = true): void {
  useEffect(() => {
    if (!when) return;
    const { tour } = useUi.getState();
    const { seenTips, tourDone } = useProgress.getState();
    // Not on top of the tour; and the tour itself is the first visit's welcome.
    if (tour.active || seenTips.includes(id)) return;
    if (!tourDone && id !== 'private-mode' && !useProgress.getState().seenIntro) return;
    useProgress.setState({ seenTips: [...seenTips, id] });
    useUi.getState().showTip(id);
  }, [id, when]);
}

export default function TipBubble() {
  const { guide, content, stops } = useRootData();
  const tipId = useUi((s) => s.tip);
  const hideTip = useUi((s) => s.hideTip);
  const touring = useUi((s) => s.tour.active);
  const { pathname } = useLocation();
  const still = useReducedMotion();

  // Hides after 8 s, or on the next click anywhere (the bubble never blocks the page).
  useEffect(() => {
    if (!tipId) return;
    const timer = window.setTimeout(hideTip, SHOW_MS);
    const onClick = () => hideTip();
    document.addEventListener('click', onClick);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', onClick);
    };
  }, [tipId, hideTip]);

  const tip = tipId ? guide.tips[tipId] : undefined;
  const rizal = content.characters[guide.speaker];
  // GD-6: the guide never appears on the final stop.
  const onFinalStop = pathname === `/stop/${stops.at(-1)?.id}`;

  return (
    <div className={styles.corner} aria-live="polite">
      {tip && !touring && !onFinalStop && (
        <div className={`${styles.tip} ${still ? 'motion-fade' : styles.pop}`}>
          {rizal?.portrait && (
            <CloseUpPortrait
              sheet={rizal.portrait}
              name={rizal.name}
              mood={tip.mood}
              talking={false}
              still={still}
            />
          )}
          <p className={styles.text}>
            <span className="visually-hidden">{t('guide.tipLabel')}: </span>
            {tip.text}
          </p>
          <button type="button" className={styles.close} onClick={hideTip}>
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">{t('guide.close')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
