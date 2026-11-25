import { t } from '../i18n/t';
import styles from './StatusScreen.module.css';

export default function LoadingScreen() {
  return (
    <p className={styles.screen} role="status">
      {t('app.loading')}
    </p>
  );
}
