import { apiClient } from './apiClient.js'

export interface SavedMediaItem {
  _id: string
  mediaId: string
  profileId: string
  savedAt: string
  artistName: string
  avatar?: string
  title?: string
  platform: 'youtube' | 'soundcloud' | 'spotify'
  thumbnailUrl?: string
  type: 'audio' | 'video'
  genres?: string[]
}

export const savedMediaService = {
  toggle: (profileId: string, mediaId: string) =>
    apiClient.post<{ saved: boolean }>(`/users/me/saved-media/${profileId}/${mediaId}`, {}),

  list: (filters?: { genre?: string; artist?: string }) => {
    const params = new URLSearchParams()
    if (filters?.genre) params.set('genre', filters.genre)
    if (filters?.artist) params.set('artist', filters.artist)
    const query = params.toString()
    return apiClient.get<SavedMediaItem[]>(`/users/me/saved-media${query ? `?${query}` : ''}`)
  },

  remove: (profileId: string, mediaId: string) =>
    apiClient.delete<void>(`/users/me/saved-media/${profileId}/${mediaId}`),
}
