import { useQuery } from '@tanstack/react-query'
import { collaborationsService } from '../services/collaborationsService.js'

export function useTrendingCollabs() {
  return useQuery({
    queryKey: ['collaborations', 'trending'],
    queryFn: () => collaborationsService.listTrending(),
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  })
}
