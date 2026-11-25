import { useRouteError } from 'react-router-dom';
import { t } from '../i18n/t';
import styles from './StatusScreen.module.css';

/** Shown when the game content cannot be loaded. Never a "game over" — just a retry. */
export default function ContentError() {
  const error = useRouteError();
  return (
    <div className={styles.screen} role="alert">
      <h1 className={styles.title}>{t('app.loadErrorTitle')}</h1>
      <p>{t('app.loadErrorBody')}</p>
      <button type="button" className={styles.button} onClick={() => window.location.reload()}>
        {t('app.reload')}
      </button>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className={styles.details}>{error.message}</pre>
      )}
    </div>
  );
}
