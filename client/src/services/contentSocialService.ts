import { apiClient } from './apiClient.js'
import type { ProfileComment } from '../types/index.js'

export interface ContentSocialStats {
  likeCount: number
  commentCount: number
  isLiked: boolean
}

export type ContentSocialMap = Record<string, ContentSocialStats>

export const contentSocialService = {
  getSocial: (profileId: string) =>
    apiClient.get<ContentSocialMap>(`/profiles/${profileId}/content/social`),

  like: (profileId: string, kind: 'photo' | 'media', targetId: string) =>
    apiClient.post<{ liked: boolean; likeCount: number }>(
      `/profiles/${profileId}/content/${kind}/${targetId}/like`,
      {},
    ),

  getComments: (profileId: string, kind: 'photo' | 'media', targetId: string) =>
    apiClient.get<ProfileComment[]>(
      `/profiles/${profileId}/content/${kind}/${targetId}/comments`,
    ),

  postComment: (profileId: string, kind: 'photo' | 'media', targetId: string, text: string, parentId?: string) =>
    apiClient.post<ProfileComment>(
      `/profiles/${profileId}/content/${kind}/${targetId}/comments`,
      { text, ...(parentId ? { parentId } : {}) },
    ),

  editComment: (profileId: string, kind: 'photo' | 'media', targetId: string, commentId: string, text: string) =>
    apiClient.patch<ProfileComment>(
      `/profiles/${profileId}/content/${kind}/${targetId}/comments/${commentId}`,
      { text },
    ),

  likeComment: (profileId: string, kind: 'photo' | 'media', targetId: string, commentId: string) =>
    apiClient.post<{ liked: boolean; likeCount: number }>(
      `/profiles/${profileId}/content/${kind}/${targetId}/comments/${commentId}/like`,
      {},
    ),

  deleteComment: (profileId: string, kind: 'photo' | 'media', targetId: string, commentId: string) =>
    apiClient.delete<void>(
      `/profiles/${profileId}/content/${kind}/${targetId}/comments/${commentId}`,
    ),
}
