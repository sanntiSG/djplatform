import { apiClient } from './apiClient.js'
import type { MediaResolveOutput } from '../types/index.js'

export interface TrackWithProfile {
  track: {
    id: string
    platform: string
    url: string
    embedId?: string
    embedHtml?: string
    type: string
    title?: string
    description?: string
    genres?: string[]
    addedAt?: string
  }
  profile: {
    id: string
    slug: string
    artistName: string
    avatar?: string
  }
}

export const mediaService = {
  resolve: (url: string) => apiClient.post<MediaResolveOutput>('/media/resolve', { url }),
  tracksByGenre: (slug: string) => apiClient.get<TrackWithProfile[]>(`/media/by-genre/${slug}`),
}
