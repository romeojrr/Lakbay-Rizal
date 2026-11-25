// Screen state that is not part of saved progress: which region was last viewed, where the
// timeline slider sits and whether the timeline strip is expanded. Lives for the visit only.
import { create } from 'zustand';
import type { RegionId } from '../content/schemas';

/** §3.8: an achievement toast or a rank-up banner, shown one after another. */
export type Celebration = { kind: 'achievement'; id: string } | { kind: 'rank'; id: string };

interface UiState {
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
  timelineExpanded: false,
  pendingFocus: null,
  celebrations: [],
  celebrate: (item) => set((s) => ({ celebrations: [...s.celebrations, item] })),
  dismissCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
  storyStep: {},
  setStoryStep: (stopId, step) => set((s) => ({ storyStep: { ...s.storyStep, [stopId]: step } })),
  setLastRegion: (lastRegion) => set({ lastRegion }),
  setTimelineYear: (timelineYear) => set({ timelineYear }),
  setTimelineExpanded: (timelineExpanded) => set({ timelineExpanded }),
}));
