import { forwardRef, type HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import styles from './Panel.module.css';

/** White card with the 3 px ink border and hard shadow (SRS §5.3). */
const Panel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Panel(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx(styles.panel, className)} {...rest} />;
});

export default Panel;
