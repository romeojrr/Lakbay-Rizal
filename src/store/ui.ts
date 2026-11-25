// Screen state that is not part of saved progress: which region was last viewed, where the
// timeline slider sits and whether the timeline strip is expanded. Lives for the visit only.
import { create } from 'zustand';
import type { RegionId } from '../content/schemas';

/** §3.8: an achievement toast or a rank-up banner, shown one after another. */
export type Celebration =
  | { kind: 'achievement'; id: string }
  | { kind: 'rank'; id: string }
  /** §3.9: suggest downloading a save code. */
  | { kind: 'reminder'; id: 'stops' | 'days' };

interface UiState {
  /** §5.6: after completing `from`, the traveller goes to `to` on the map. */
  travel: { from: string; to: string } | null;
  /** §3.9: something is not saved yet (a quiz in progress, a name being typed). */
  unsaved: boolean;
  setUnsaved: (unsaved: boolean) => void;
  /** §3.7 the guided tour: running, and at which step. */
  tour: { active: boolean; step: number };
  /** The tour has been offered this visit (so it does not start twice). */
  tourOffered: boolean;
  startTour: () => void;
  setTourStep: (step: number) => void;
  endTour: () => void;
  /** §3.7 a one-time tip in the corner. */
  tip: string | null;
  showTip: (id: string) => void;
  hideTip: () => void;
  celebrations: Celebration[];
  celebrate: (item: Celebration) => void;
  /** Removes the celebration that has been shown. */
  dismissCelebration: () => void;
  lastRegion: RegionId | null;
  /** null = follow the player's next stop. */
  timelineYear: number | null;
  /** §5.5: the timeline is a slim strip under the map, expandable. */
  timelineExpanded: boolean;
  /**
   * Switching language re-renders the whole app (§3.10). The control that was used sets
   * this so it can take the focus back afterwards.
   */
  pendingFocus: string | null;
  /** §3.6: where the player is in each stop's story (survives a language switch). */
  storyStep: Record<string, number>;
  setLastRegion: (region: RegionId) => void;
  setStoryStep: (stopId: string, step: number) => void;
  setTimelineYear: (year: number | null) => void;
  setTimelineExpanded: (expanded: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  lastRegion: null,
  timelineYear: null,
  timelineExpanded: true,
  pendingFocus: null,
  travel: null,
  unsaved: false,
  setUnsaved: (unsaved) => set({ unsaved }),
  tour: { active: false, step: 0 },
  tourOffered: false,
  startTour: () => set({ tour: { active: true, step: 0 }, tourOffered: true, tip: null }),
  setTourStep: (step) => set((s) => ({ tour: { ...s.tour, step } })),
  endTour: () => set({ tour: { active: false, step: 0 } }),
  tip: null,
  showTip: (tip) => set({ tip }),
  hideTip: () => set({ tip: null }),
  celebrations: [],
  celebrate: (item) => set((s) => ({ celebrations: [...s.celebrations, item] })),
  dismissCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
  storyStep: {},
  setStoryStep: (stopId, step) => set((s) => ({ storyStep: { ...s.storyStep, [stopId]: step } })),
  setLastRegion: (lastRegion) => set({ lastRegion }),
  setTimelineYear: (timelineYear) => set({ timelineYear }),
  setTimelineExpanded: (timelineExpanded) => set({ timelineExpanded }),
}));
