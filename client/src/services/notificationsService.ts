import { apiClient } from './apiClient.js'

export interface NotificationType {
  key: string
  label: string
  description: string
  category: 'profile' | 'all'
  enabledByAdmin: boolean
  userEnabled: boolean
}

export interface NotificationPreferences {
  pushOptIn: boolean
  notificationLevel: 'profile' | 'all'
  overrides: Record<string, boolean>
}

export interface NotificationItem {
  _id: string
  type: string
  actorId?: string
  actorName?: string
  actorAvatar?: string
  payload?: Record<string, unknown>
  url?: string
  readAt: string | null
  createdAt: string
}

export interface InboxResponse {
  items: NotificationItem[]
  unreadCount: number
  nextCursor: string | null
}

export const notificationsService = {
  getTypes: () => apiClient.get<NotificationType[]>('/notifications/types'),
  getPreferences: () => apiClient.get<NotificationPreferences>('/notifications/preferences'),
  updatePreferences: (data: Partial<NotificationPreferences & { overrides: Record<string, boolean> }>) =>
    apiClient.patch<NotificationPreferences>('/notifications/preferences', data),
  getInbox: (params?: { limit?: number; before?: string }) =>
    apiClient.get<InboxResponse>(
      `/notifications/inbox${params?.before ? `?before=${params.before}` : ''}${params?.limit ? `${params?.before ? '&' : '?'}limit=${params.limit}` : ''}`,
    ),
  markRead: (id: string) => apiClient.patch<void>(`/notifications/inbox/${id}/read`, {}),
  markAllRead: () => apiClient.patch<void>('/notifications/inbox/read-all', {}),
  deleteOne: (id: string) => apiClient.delete<void>(`/notifications/inbox/${id}`),
}
