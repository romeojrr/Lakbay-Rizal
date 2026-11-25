import { forwardRef } from 'react';
import Panel from '../../components/Panel/Panel';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './QuizPage.module.css';

interface FeedbackProps {
  right: boolean;
  explain: string;
  /** The source's short title. */
  source: string;
  hint: string;
  hintOpen: boolean;
  onShowHint: () => void;
  actionLabel: string;
  onAction: () => void;
}

/**
 * After an answer (FR-41, FR-42, FR-81). Right: why it is right and the source. Wrong: a
 * small shake, the hint on request (GD-5: no penalty shown, no fail screen) and Try again.
 */
const Feedback = forwardRef<HTMLHeadingElement, FeedbackProps>(function Feedback(props, ref) {
  const { right, explain, source, hint, hintOpen } = props;
  return (
    <Panel className={cx(styles.feedback, !right && styles.shake)} role="status">
      <h2 ref={ref} tabIndex={-1} className={right ? styles.correct : styles.wrong}>
        {right ? t('quiz.correct') : t('quiz.wrong')}
      </h2>
      {right ? (
        <div className={styles.explain}>
          <p>{t('quiz.explainLine', { label: t('quiz.explain'), text: explain })}</p>
          <p className={styles.source}>{t('stop.source', { title: source })}</p>
        </div>
      ) : hintOpen ? (
        <p className={styles.hint}>{t('quiz.hintLine', { label: t('quiz.hint'), hint })}</p>
      ) : (
        <button type="button" className={styles.hintButton} onClick={props.onShowHint}>
          {t('quiz.showHint')}
        </button>
      )}
      <button type="button" className={styles.action} onClick={props.onAction}>
        {props.actionLabel}
      </button>
    </Panel>
  );
});

export default Feedback;
