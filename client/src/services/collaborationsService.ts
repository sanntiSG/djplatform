import { apiClient } from './apiClient.js'

export interface CollaborationItem {
  id: string
  fromProfileId: string
  toProfileId: string
  fromArtistName: string
  fromAvatar?: string
  toArtistName: string
  toAvatar?: string
  title: string
  year?: number
  type?: 'track' | 'event' | 'visual' | 'other' | 'opportunity'
  opportunityId?: string
  confirmedByA: boolean
  confirmedByB: boolean
  isConfirmed: boolean
  confirmedAt?: string
}

export interface PendingCollaboration {
  id: string
  fromProfileId: string
  fromArtistName: string
  fromAvatar?: string
  title: string
  year?: number
  type?: string
  createdAt: string
}

export interface TrendingCollabItem {
  id: string
  fromArtistName: string
  fromAvatar?: string
  toArtistName: string
  toAvatar?: string
  fromProfileId: string
  toProfileId: string
  title: string
  type?: 'track' | 'event' | 'visual' | 'other' | 'opportunity'
  confirmedAt: string
}

export interface RequestCollabInput {
  toProfileId: string
  title: string
  year?: number
  type?: 'track' | 'event' | 'visual' | 'other'
}

export const collaborationsService = {
  request: (data: RequestCollabInput) =>
    apiClient.post<CollaborationItem>('/collaborations', data),

  confirm: (id: string) =>
    apiClient.post<CollaborationItem>(`/collaborations/${id}/confirm`, {}),

  reject: (id: string) =>
    apiClient.delete<{ ok: boolean }>(`/collaborations/${id}`),

  listForProfile: (profileId: string) =>
    apiClient.get<CollaborationItem[]>(`/collaborations/profile/${profileId}`),

  listPending: () =>
    apiClient.get<PendingCollaboration[]>('/collaborations/pending'),

  listTrending: (days = 7) =>
    apiClient.get<{ items: TrendingCollabItem[] }>(`/collaborations/trending?days=${days}`),
}
