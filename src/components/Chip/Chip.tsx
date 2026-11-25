import type { Theme } from '../../content/schemas';
import { t } from '../../i18n/t';
import { cx } from '../../lib/cx';
import styles from './Chip.module.css';

/** Theme label, e.g. "Writing", in its theme color. */
export default function Chip({ theme }: { theme: Theme }) {
  return <span className={cx('pixel', styles.chip, styles[theme])}>{t(`themes.${theme}`)}</span>;
}
