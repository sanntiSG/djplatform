import { useQuery } from '@tanstack/react-query'
import { activityService } from '../services/activityService.js'

export function useActivityFeed(limit = 20) {
  return useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: () => activityService.list(limit),
    staleTime: 60_000,
    refetchInterval: 90_000,
  })
}
