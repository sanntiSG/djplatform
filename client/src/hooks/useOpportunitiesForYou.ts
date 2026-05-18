import { useQuery } from '@tanstack/react-query'
import { opportunityService } from '../services/opportunityService.js'
import { useAuthStore } from '../store/useAuthStore.js'

export function useOpportunitiesForYou(limit = 6) {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['opportunities', 'for-you', limit],
    queryFn: () => opportunityService.forYou(limit),
    staleTime: 5 * 60_000,
    enabled: !!user,
  })
}
