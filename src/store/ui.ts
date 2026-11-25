// Screen state that is not part of saved progress: which region was last viewed, where the
// timeline slider sits and whether the timeline strip is expanded. Lives for the visit only.
import { create } from 'zustand';
import type { RegionId } from '../content/schemas';

interface UiState {
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
  setLastRegion: (region: RegionId) => void;
  setTimelineYear: (year: number | null) => void;
  setTimelineExpanded: (expanded: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  lastRegion: null,
  timelineYear: null,
  timelineExpanded: false,
  pendingFocus: null,
  setLastRegion: (lastRegion) => set({ lastRegion }),
  setTimelineYear: (timelineYear) => set({ timelineYear }),
  setTimelineExpanded: (timelineExpanded) => set({ timelineExpanded }),
}));
