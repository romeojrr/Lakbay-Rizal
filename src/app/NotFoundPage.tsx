import { Link } from 'react-router-dom';
import Panel from '../components/Panel/Panel';
import { t } from '../i18n/t';
import styles from './StatusScreen.module.css';

/** Any unknown URL (M6 404 page). */
export default function NotFoundPage() {
  return (
    <Panel className={styles.screen}>
      <h1 className={styles.title}>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <Link className={styles.button} to="/">
        {t('notFound.home')}
      </Link>
    </Panel>
  );
}
