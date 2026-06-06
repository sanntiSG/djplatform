import { apiClient } from './apiClient.js'

export type ActivityEventType =
  | 'profile_created'
  | 'event_published'
  | 'media_added'
  | 'photo_added'
  | 'profile_updated'
  | 'collab_verified'
  | 'opportunity_posted'
  | 'project_created'
  | 'project_progress'
  | 'project_completed'
  | 'trending_track'
  | 'trending_artist'
  | 'news_article'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  source?: string
  region?: 'ar' | 'latam' | 'world'
  actorProfileId: string | null
  actorName: string
  actorAvatar?: string
  actorSlug?: string | null
  targetTitle?: string
  targetUrl?: string
  targetImage?: string
  partnerName?: string
  partnerAvatar?: string
  partnerSlug?: string
  createdAt: string
  isExternal?: boolean
}

export const activityService = {
  list: (limit = 20) =>
    apiClient.get<ActivityEvent[]>(`/activity?limit=${limit}`),
}
