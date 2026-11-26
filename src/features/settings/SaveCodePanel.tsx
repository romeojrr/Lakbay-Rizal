import { useState, type ChangeEvent } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { useGame } from '../../game/useGame';
import { t, type MessageKey } from '../../i18n/t';
import { useProgress, type Progress } from '../../store/progress';
import { decodeSave, encodeSave, type LoadError } from '../../store/saveCode';
import styles from './SettingsPage.module.css';

const ERRORS: Record<LoadError, MessageKey> = {
  empty: 'save.loadErrEmpty',
  format: 'save.loadErrFormat',
  checksum: 'save.loadErrChecksum',
  newer: 'save.loadErrNewer',
  damaged: 'save.loadErrDamaged',
};

/** Downloads `text` as a .lakbay file. */
function downloadFile(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `lakbay-rizal-${new Date().toISOString().slice(0, 10)}.lakbay`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * SRS v2.3 §3.9 save code: Download gives a copyable code and a .lakbay file; Load accepts
 * either. A code that cannot be read changes nothing; a good one replaces all progress
 * after a confirmation (never a partial load).
 */
export default function SaveCodePanel() {
  const game = useGame();
  const remindersOn = useProgress((s) => s.save.remindersOn);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<LoadError | null>(null);
  const [pending, setPending] = useState<Progress | null>(null);
  const [loaded, setLoaded] = useState(false);

  const exportCode = () => {
    const text = encodeSave(useProgress.getState());
    setCode(text);
    setCopied(false);
    downloadFile(text);
    useProgress.setState((s) => ({ save: { ...s.save, lastExportAt: new Date().toISOString() } }));
    game.check(); // `safe-traveller`
  };

  const check = (text: string) => {
    setLoaded(false);
    const result = decodeSave(text);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setPending(result.progress);
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) check(await file.text());
  };

  const apply = () => {
    if (!pending) return;
    useProgress.setState(pending);
    setPending(null);
    setInput('');
    setLoaded(true);
    game.check();
  };

  return (
    <section
      id="save-code"
      className={`${styles.fieldset} ${styles.stack}`}
      aria-labelledby="save-code-title"
    >
      <h2 id="save-code-title" className={styles.legend}>
        {t('save.title')}
      </h2>
      <p className={styles.help}>{t('save.help')}</p>
      <button type="button" className={styles.reset} onClick={exportCode}>
        {t('save.export')}
      </button>
      {code && (
        <div className={styles.codeBox}>
          <label htmlFor="save-code-out" className={styles.help}>
            {t('save.codeLabel')}
          </label>
          <textarea id="save-code-out" className={styles.code} readOnly value={code} rows={3} />
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              void navigator.clipboard?.writeText(code).then(() => setCopied(true));
            }}
          >
            {copied ? t('save.copied') : t('save.copy')}
          </button>
        </div>
      )}

      <div className={styles.codeBox}>
        <label htmlFor="save-code-in" className={styles.help}>
          {t('save.loadLabel')}
        </label>
        <textarea
          id="save-code-in"
          className={styles.code}
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-describedby={error ? 'save-code-error' : undefined}
        />
      </div>
      <div className={styles.row}>
        <button type="button" className={styles.reset} onClick={() => check(input)}>
          {t('save.load')}
        </button>
        <label className={styles.file}>
          {t('save.loadFile')}
          <input type="file" accept=".lakbay,text/plain" onChange={onFile} />
        </label>
      </div>
      {error && (
        <p id="save-code-error" className={styles.error} role="alert">
          {t(ERRORS[error])}
        </p>
      )}
      {loaded && (
        <p className={styles.help} role="status">
          {t('save.importOk')}
        </p>
      )}
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={remindersOn}
          onChange={(e) =>
            useProgress.setState((s) => ({ save: { ...s.save, remindersOn: e.target.checked } }))
          }
        />
        <span>{t('save.reminders')}</span>
      </label>
      <ConfirmDialog
        open={pending !== null}
        title={t('save.import')}
        message={t('save.confirmLoad')}
        confirmLabel={t('save.load')}
        onConfirm={apply}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}
