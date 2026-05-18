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

export interface CollectionStat {
  name: string
  count: number
  sizeMb: number
  indexSizeMb: number
}

export interface DbStats {
  totalDataMb: number
  totalStorageMb: number
  totalIndexMb: number
  collections: CollectionStat[]
  recommendations: string[]
}

export const adminService = {
  getStats: () => apiClient.get<AdminStats>('/admin/stats'),
  getDbStats: () => apiClient.get<DbStats>('/admin/db-stats'),
  cleanupInactiveProfiles: () => apiClient.post<{ deleted: number }>('/admin/cleanup/inactive-profiles', {}),

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

  getNotificationTypes: () =>
    apiClient.get<{ types: AdminNotificationType[]; stats: { total: number; active: number; inactive: number } }>('/admin/notification-types'),

  updateNotificationType: (key: string, enabledByAdmin: boolean) =>
    apiClient.patch<AdminNotificationType>(`/admin/notification-types/${key}`, { enabledByAdmin }),

  bulkUpdateNotificationTypes: (enabledByAdmin: boolean) =>
    apiClient.post<{ ok: boolean }>('/admin/notification-types/bulk', { enabledByAdmin }),

  getPushStatus: () =>
    apiClient.get<{ vapidConfigured: boolean; vapidPublicKeyFingerprint: string; subscriptionsCount: number }>('/admin/push-status'),

  testPush: (userId?: string) =>
    apiClient.post<{ ok: boolean; attempted: number }>('/admin/push-test', userId ? { userId } : {}),

  getSystem: () => apiClient.get<SystemSettings>('/admin/system'),
  updateSystem: (data: SystemSettings) => apiClient.patch<SystemSettings>('/admin/system', data),
}

export interface SystemSettings {
  trendingRefreshMinutes: number
  collabsFeedTtlHours: number
}

export interface AdminNotificationType {
  _id: string
  key: string
  label: string
  description: string
  category: 'profile' | 'all'
  enabledByAdmin: boolean
  createdAt: string
  updatedAt: string
}
