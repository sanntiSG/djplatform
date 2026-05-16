import { apiClient } from './apiClient.js'

export interface OpportunityResponse {
  id: string
  profileId: string
  userId: string
  artistName: string
  avatar?: string
  title: string
  description?: string
  lookingForRoles: string[]
  genres: string[]
  location?: string
  eventDate?: string
  isPaid: boolean
  isRemote: boolean
  status: 'open' | 'closed' | 'filled'
  applicantCount: number
  isApplied: boolean
  createdAt: string
}

export interface CreateOpportunityInput {
  title: string
  description?: string
  lookingForRoles: string[]
  genres?: string[]
  location?: string
  eventDate?: string
  isPaid: boolean
  isRemote: boolean
}

export const opportunityService = {
  list: (params?: { role?: string; genre?: string; location?: string; isRemote?: boolean; isPaid?: boolean; cursor?: string }) => {
    const qs = new URLSearchParams()
    if (params?.role) qs.set('role', params.role)
    if (params?.genre) qs.set('genre', params.genre)
    if (params?.location) qs.set('location', params.location)
    if (params?.isRemote) qs.set('isRemote', 'true')
    if (params?.isPaid) qs.set('isPaid', 'true')
    if (params?.cursor) qs.set('cursor', params.cursor)
    const q = qs.toString()
    return apiClient.get<OpportunityResponse[]>(`/opportunities${q ? `?${q}` : ''}`)
  },

  getById: (id: string) =>
    apiClient.get<OpportunityResponse>(`/opportunities/${id}`),

  create: (data: CreateOpportunityInput) =>
    apiClient.post<OpportunityResponse>('/opportunities', data),

  update: (id: string, data: Partial<CreateOpportunityInput & { status: string }>) =>
    apiClient.patch<OpportunityResponse>(`/opportunities/${id}`, data),

  remove: (id: string) =>
    apiClient.delete<{ ok: boolean }>(`/opportunities/${id}`),

  apply: (id: string) =>
    apiClient.post<{ conversationId: string }>(`/opportunities/${id}/apply`, {}),
}
