import { apiClient } from './apiClient.js'
import type { MediaItem } from '../types/index.js'

interface ModerationResponse {
  approved: boolean
  reasons?: string[]
  error?: string
}

export const moderationService = {
  analyzeImage: (url: string): Promise<ModerationResponse> =>
    apiClient.post<ModerationResponse>('/moderation/check', { url, kind: 'image' }),

  analyzeMedia: (item: Partial<MediaItem> & { url: string }): Promise<ModerationResponse> =>
    apiClient.post<ModerationResponse>('/moderation/check', {
      url: item.url,
      kind: 'media',
      platform: item.platform,
      title: item.title ?? '',
      embedId: item.embedId,
    }),

  deleteUploadedAsset: (url: string): Promise<void> =>
    apiClient.post<void>('/uploads/asset-delete', { url }),
}
