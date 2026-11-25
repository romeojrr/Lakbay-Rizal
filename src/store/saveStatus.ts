// SRS v2.3 §3.9: did the last save work? The top bar's save indicator shows it.
import { create } from 'zustand';

interface SaveStatus {
  /** 'idle' before the first save of this visit. */
  state: 'idle' | 'saved' | 'failed';
  /** Goes up with every save, so the indicator can show "Saved" again. */
  count: number;
  report: (ok: boolean) => void;
}

export const useSaveStatus = create<SaveStatus>()((set) => ({
  state: 'idle',
  count: 0,
  report: (ok) => set((s) => ({ state: ok ? 'saved' : 'failed', count: s.count + 1 })),
}));
