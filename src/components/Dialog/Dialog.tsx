import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { t } from '../../i18n/t';
import styles from './Dialog.module.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal dialog on the native <dialog> element: the page behind is inert (focus stays inside),
 * Esc closes it, and focus returns to the button that opened it.
 */
export default function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      if (opener.current instanceof HTMLElement) opener.current.focus();
    }
  }, [open]);

  // FR-33 focus trap: a native modal lets Tab escape to the browser's own controls,
  // so cycle Tab and Shift+Tab between the first and last focusable elements.
  const trapTab = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="dialog-title"
      onKeyDown={trapTab}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.head}>
        <h2 id="dialog-title" className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          {t('stop.close')}
        </button>
      </div>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
