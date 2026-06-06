import { create } from 'zustand'
import type { SavedMediaItem } from '../services/savedMediaService.js'

/** Where the player was launched from — controls which UI chrome is visible */
export type PlayerSource = 'library' | 'recommendations'

interface PlayerState {
  queue: SavedMediaItem[]
  index: number
  isPlaying: boolean
  expanded: boolean
  /** Context that opened the player. Drives conditional UI in the maximized view. */
  source: PlayerSource
  // Derived: current item
  current: () => SavedMediaItem | null
  // Actions
  playQueue: (queue: SavedMediaItem[], index: number, source?: PlayerSource) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  setExpanded: (v: boolean) => void
  close: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  isPlaying: false,
  expanded: false,
  source: 'library',

  current: () => {
    const { queue, index } = get()
    if (queue.length === 0) return null
    return queue[index] ?? null
  },

  playQueue: (queue, index, source = 'library') => {
    set({ queue, index, isPlaying: true, expanded: false, source })
  },

  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }))
  },

  next: () => {
    const { queue, index } = get()
    if (queue.length === 0) return
    const next = (index + 1) % queue.length
    set({ index: next, isPlaying: true })
  },

  prev: () => {
    const { queue, index } = get()
    if (queue.length === 0) return
    const prev = (index - 1 + queue.length) % queue.length
    set({ index: prev, isPlaying: true })
  },

  setExpanded: (v) => {
    set({ expanded: v })
  },

  close: () => {
    set({ queue: [], index: 0, isPlaying: false, expanded: false, source: 'library' })
  },
}))
