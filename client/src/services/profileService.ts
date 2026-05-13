import { apiClient } from './apiClient.js'
import type { ProfileResponse, CreateProfileInput, UpdateProfileInput } from '../types/index.js'

export const profileService = {
  create: (data: CreateProfileInput) => apiClient.post<ProfileResponse>('/profiles', data),
  getMine: () => apiClient.get<ProfileResponse>('/profiles/me'),
  updateMine: (data: UpdateProfileInput) => apiClient.patch<ProfileResponse>('/profiles/me', data),
  getById: (id: string) => apiClient.get<ProfileResponse>(`/profiles/${id}`),
  updatePhotoCaption: (photoId: string, caption: string) =>
    apiClient.patch<{ id: string; caption: string }>(`/profiles/me/photos/${photoId}`, { caption }),

  updateMediaItem: (mediaId: string, patch: { title?: string; description?: string; genres?: string[] }) =>
    apiClient.patch<{ id: string; title?: string; description: string; genres: string[] }>(
      `/profiles/me/media/${mediaId}`,
      patch,
    ),

  getTop: (limit = 10) =>
    apiClient.get<ProfileResponse[]>(`/profiles/top?limit=${limit}`),

  list: (params?: {
    type?: string
    location?: string
    genres?: string[]
    eventTypes?: string[]
    availability?: string
    q?: string
    limit?: number
    cursor?: string
  }) => {
    const qs = new URLSearchParams()
    if (params?.type) qs.set('type', params.type)
    if (params?.location) qs.set('location', params.location)
    if (params?.genres?.length) qs.set('genres', params.genres.join(','))
    if (params?.eventTypes?.length) qs.set('eventTypes', params.eventTypes.join(','))
    if (params?.availability) qs.set('availability', params.availability)
    if (params?.q) qs.set('q', params.q)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.cursor) qs.set('cursor', params.cursor)
    const q = qs.toString()
    return apiClient.get<ProfileResponse[]>(`/profiles${q ? `?${q}` : ''}`)
  },
}
