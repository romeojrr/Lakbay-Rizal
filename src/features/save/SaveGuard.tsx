import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/t';
import { useProgress } from '../../store/progress';
import { useUi } from '../../store/ui';
import { useTip } from '../guide/TipBubble';
import styles from './SaveGuard.module.css';

const PROBE_KEY = 'lakbay-rizal:probe';
/** A private window gets a small storage quota (regular windows get gigabytes). */
const PRIVATE_QUOTA = 120 * 1024 * 1024;
const REMIND_EVERY_STOPS = 5;
const REMIND_AFTER_DAYS = 7;

async function looksPrivate(): Promise<boolean> {
  try {
    localStorage.setItem(PROBE_KEY, '1');
    localStorage.removeItem(PROBE_KEY);
  } catch {
    return true;
  }
  try {
    const estimate = await navigator.storage?.estimate?.();
    return estimate?.quota !== undefined && estimate.quota < PRIVATE_QUOTA;
  } catch {
    return false;
  }
}

/**
 * SRS v2.3 §3.9 refresh safety, all in one place:
 * 2. the browser's "Leave site?" box only while something is really unsaved (a quiz in
 *    progress, a certificate name being typed); never on ordinary pages;
 * 3. ask the browser to keep the save after the first completed stop;
 * 4. a private window: a banner and Rizal's tip;
 * 6. a reminder to download a save code every 5 completed stops, or 7 days after the last one.
 */
export default function SaveGuard() {
  const unsaved = useUi((s) => s.unsaved);
  const completed = useProgress((s) => s.completed.length);
  const [isPrivate, setPrivate] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const lastCount = useRef(completed);

  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ''; // older browsers need this; the text is the browser's own
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  useEffect(() => {
    const { save } = useProgress.getState();
    if (completed < 1 || save.persisted !== undefined || !navigator.storage?.persist) return;
    void navigator.storage
      .persist()
      .then((persisted) => useProgress.setState((s) => ({ save: { ...s.save, persisted } })));
  }, [completed]);

  useEffect(() => {
    let alive = true;
    void looksPrivate().then((value) => alive && setPrivate(value));
    return () => {
      alive = false;
    };
  }, []);
  useTip('private-mode', isPrivate);

  // Reminders: on reaching 5, 10, … completed stops, and once a visit after 7 days.
  useEffect(() => {
    const { save } = useProgress.getState();
    const before = lastCount.current;
    lastCount.current = completed;
    if (!save.remindersOn) return;
    if (completed > before && completed % REMIND_EVERY_STOPS === 0) {
      useUi.getState().celebrate({ kind: 'reminder', id: 'stops' });
    }
  }, [completed]);
  useEffect(() => {
    const { save, completed: done } = useProgress.getState();
    if (!save.remindersOn || !save.lastExportAt || done.length === 0) return;
    const days = (Date.now() - Date.parse(save.lastExportAt)) / 86_400_000;
    if (days >= REMIND_AFTER_DAYS) useUi.getState().celebrate({ kind: 'reminder', id: 'days' });
  }, []);

  if (!isPrivate || !bannerOpen) return null;
  return (
    <div className={styles.banner} role="region" aria-label={t('save.privateTitle')}>
      <p className={styles.text}>{t('save.privateBody')}</p>
      <Link to="/settings#save-code" className={styles.action}>
        {t('save.privateAction')}
      </Link>
      <button type="button" className={styles.close} onClick={() => setBannerOpen(false)}>
        {t('save.dismiss')}
      </button>
    </div>
  );
}
