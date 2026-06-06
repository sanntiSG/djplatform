import { useQuery } from '@tanstack/react-query'
import { trendingService } from '../services/trendingService.js'
import type { TrendingItem } from '../types/index.js'

/** Raw data: separate arrays of events and songs from the backend */
export function useTrendingRaw() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: () => trendingService.get(),
    staleTime: 5 * 60_000, // 5 min — trending changes slowly
  })
}

/**
 * Merged and sorted list of trending events + songs by likeCount desc.
 * Returns `TrendingItem[]` ready to render (no pagination, full list).
 */
export function useTrending(limit?: number) {
  const query = useTrendingRaw()

  const items: TrendingItem[] = []

  if (query.data) {
    const { events, songs } = query.data
    const all: TrendingItem[] = [
      ...events,
      ...songs,
    ]
    all.sort((a, b) => b.likeCount - a.likeCount)
    if (limit) {
      items.push(...all.slice(0, limit))
    } else {
      items.push(...all)
    }
  }

  return {
    ...query,
    items,
  }
}
