import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient.js'
import { useAuthStore } from '../store/useAuthStore.js'

export interface LikedProfileItem {
  profileId: string
  artistName: string
  avatar?: string
  genres: string[]
  type: string
  likedAt: string
}

async function fetchLikedProfiles() {
  return apiClient.get<LikedProfileItem[]>('/profiles/me/liked')
}

export const LIKED_PROFILES_KEY = ['profiles', 'liked-me'] as const

export function useLikedProfiles() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: LIKED_PROFILES_KEY,
    queryFn: fetchLikedProfiles,
    enabled: Boolean(token),
    staleTime: 30_000,
  })
}

export function useInvalidateLikedProfiles() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: LIKED_PROFILES_KEY })
}
