import { apiClient } from './apiClient.js'

export type ActivityEventType =
  | 'profile_created'
  | 'event_published'
  | 'media_added'
  | 'photo_added'
  | 'profile_updated'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  actorProfileId: string
  actorName: string
  actorAvatar?: string
  actorSlug?: string
  targetTitle?: string
  targetUrl?: string
  createdAt: string
}

export const activityService = {
  list: (limit = 20) =>
    apiClient.get<ActivityEvent[]>(`/activity?limit=${limit}`),
}
