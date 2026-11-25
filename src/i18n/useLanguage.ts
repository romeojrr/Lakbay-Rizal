// Choosing the language (SRS v2.3 §3.10). The choice is saved in the progress settings.
import { useEffect, type RefObject } from 'react';
import { loadTranslations } from '../content/translations';
import { useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import type { Lang } from './language';

export function useLanguage(): Lang {
  return useProgress((s) => s.settings.lang);
}

/**
 * Switches language without a reload. Filipino content is fetched first, so the page never
 * shows half of each language; if it cannot be fetched, the UI still switches and the
 * content stays English (per-string fallback). `focusId` names the control to refocus.
 */
export async function changeLanguage(lang: Lang, focusId?: string): Promise<void> {
  if (lang === useProgress.getState().settings.lang) return;
  if (lang === 'fil') await loadTranslations();
  useUi.setState({ pendingFocus: focusId ?? null });
  useProgress.getState().setSettings({ lang });
}

/** After a language switch re-renders the app, gives the focus back to the control used. */
export function useRestoreFocus(id: string, ref: RefObject<HTMLElement>): void {
  useEffect(() => {
    if (useUi.getState().pendingFocus !== id) return;
    useUi.setState({ pendingFocus: null });
    ref.current?.focus();
  }, [id, ref]);
}
