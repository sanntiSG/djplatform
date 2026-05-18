import { useQuery } from '@tanstack/react-query'
import { collaborationsService } from '../services/collaborationsService.js'

export function useTrendingCollabs(days = 7) {
  return useQuery({
    queryKey: ['collaborations', 'trending', days],
    queryFn: () => collaborationsService.listTrending(days),
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  })
}
