import { create } from 'zustand'
import type { Badge } from '../types'

/**
 * Ephemeral UI state only. Anything persistent lives in IndexedDB and is read
 * through useLiveQuery — keeping it out of here avoids two sources of truth.
 */
interface UiState {
  /** Badges waiting to be shown in the celebration modal, oldest first. */
  badgeQueue: Badge[]
  /** Set when a log clears a level, so the modal can lead with the level-up. */
  levelUpMessage: string | null
  enqueueBadges: (badges: Badge[]) => void
  setLevelUp: (message: string | null) => void
  dismissCelebration: () => void
}

export const useUiStore = create<UiState>((set) => ({
  badgeQueue: [],
  levelUpMessage: null,
  enqueueBadges: (badges) =>
    set((state) => ({ badgeQueue: [...state.badgeQueue, ...badges] })),
  setLevelUp: (message) => set({ levelUpMessage: message }),
  dismissCelebration: () => set({ badgeQueue: [], levelUpMessage: null }),
}))
