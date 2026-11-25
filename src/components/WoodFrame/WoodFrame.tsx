import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './WoodFrame.module.css';

/** The wooden frame around maps and scenes (mockup Main.dc.html). */
export default function WoodFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx(styles.frame, className)}>{children}</div>;
}
