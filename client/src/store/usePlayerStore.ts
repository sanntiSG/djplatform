import { create } from 'zustand'
import type { SavedMediaItem } from '../services/savedMediaService.js'

interface PlayerState {
  queue: SavedMediaItem[]
  index: number
  isPlaying: boolean
  expanded: boolean
  // Derived: current item
  current: () => SavedMediaItem | null
  // Actions
  playQueue: (queue: SavedMediaItem[], index: number) => void
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

  current: () => {
    const { queue, index } = get()
    if (queue.length === 0) return null
    return queue[index] ?? null
  },

  playQueue: (queue, index) => {
    set({ queue, index, isPlaying: true, expanded: false })
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
    set({ queue: [], index: 0, isPlaying: false, expanded: false })
  },
}))
