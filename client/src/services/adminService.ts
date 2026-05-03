import { apiClient } from './apiClient.js'
import type { ProfileResponse, EventResponse } from '../types/index.js'

export interface AdminStats {
  totalUsers: number
  totalProfiles: number
  activeProfiles: number
  totalEvents: number
  activeEvents: number
  newUsersThisMonth: number
  newUsersThisWeek: number
}

export interface AdminUser {
  _id: string
  email: string
  role: 'user' | 'admin'
  mustChangePassword: boolean
  profileId?: string
  createdAt: string
}

export const adminService = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),

  listProfiles: (params?: { visible?: 'all' | 'true' | 'false'; cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.visible) qs.set('visible', params.visible)
    if (params?.cursor) qs.set('cursor', params.cursor)
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return apiClient.get<ProfileResponse[]>(`/admin/profiles${q ? `?${q}` : ''}`)
  },

  setProfileVisibility: (id: string, isVisible: boolean) =>
    apiClient.patch<ProfileResponse>(`/admin/profiles/${id}/visibility`, { isVisible }),

  deleteProfile: (id: string) => apiClient.delete<void>(`/admin/profiles/${id}`),

  listEvents: (params?: { visible?: 'all' | 'true' | 'false'; cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.visible) qs.set('visible', params.visible)
    if (params?.cursor) qs.set('cursor', params.cursor)
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return apiClient.get<EventResponse[]>(`/admin/events${q ? `?${q}` : ''}`)
  },

  setEventVisibility: (id: string, isVisible: boolean) =>
    apiClient.patch<EventResponse>(`/admin/events/${id}/visibility`, { isVisible }),

  deleteEvent: (id: string) => apiClient.delete<void>(`/admin/events/${id}`),

  listUsers: (params?: { cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.cursor) qs.set('cursor', params.cursor)
    if (params?.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return apiClient.get<AdminUser[]>(`/admin/users${q ? `?${q}` : ''}`)
  },
}
