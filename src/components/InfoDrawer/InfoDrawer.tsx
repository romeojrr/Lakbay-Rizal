import { useEffect, useRef, type ReactNode } from 'react';
import { t } from '../../i18n/t';
import styles from './InfoDrawer.module.css';

interface InfoDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Stop "Info" (SRS v2.3 §5.5): a right-hand drawer over the scene on desktop, shown under
 * the scene on phones (the Story | Info switch). Esc closes it; focus moves in and back.
 * When closed it stays in the page (hidden), so guide targets inside it can be found.
 */
export default function InfoDrawer({ id, open, onClose, children }: InfoDrawerProps) {
  const ref = useRef<HTMLElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    ref.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener.current instanceof HTMLElement && document.contains(opener.current)) {
        opener.current.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  return (
    <section
      ref={ref}
      id={id}
      className={styles.drawer}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      hidden={!open}
    >
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.title}>
          {t('stop.infoTitle')}
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          {t('stop.closeInfo')}
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
