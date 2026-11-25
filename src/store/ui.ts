// Screen state that is not part of saved progress: which region was last viewed and
// where the timeline slider sits. Lives for the visit only.
import { create } from 'zustand';
import type { RegionId } from '../content/schemas';

interface UiState {
  lastRegion: RegionId | null;
  /** null = follow the player's next stop. */
  timelineYear: number | null;
  setLastRegion: (region: RegionId) => void;
  setTimelineYear: (year: number | null) => void;
}

export const useUi = create<UiState>()((set) => ({
  lastRegion: null,
  timelineYear: null,
  setLastRegion: (lastRegion) => set({ lastRegion }),
  setTimelineYear: (timelineYear) => set({ timelineYear }),
}));
