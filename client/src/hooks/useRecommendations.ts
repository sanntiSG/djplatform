import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient.js'
import { useAuthStore } from '../store/useAuthStore.js'

export interface RecommendedSong {
  profileId: string
  mediaId: string
  artistName: string
  avatar?: string
  title?: string
  platform: 'youtube' | 'soundcloud' | 'spotify'
  thumbnailUrl?: string
  type: 'audio' | 'video'
  genres?: string[]
}

export interface RecommendedArtist {
  profileId: string
  artistName: string
  avatar?: string
  genres: string[]
  type: string
  location?: string
}

export function useRecommendedSongs(limit = 5) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['recommendations', 'songs', limit],
    queryFn: () => apiClient.get<RecommendedSong[]>(`/feed/recommendations/songs?limit=${limit}`),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  })
}

export function useRecommendedArtists(limit = 5) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['recommendations', 'artists', limit],
    queryFn: () => apiClient.get<RecommendedArtist[]>(`/feed/recommendations/artists?limit=${limit}`),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  })
}
