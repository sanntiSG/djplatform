import { apiClient } from './apiClient.js'
import type { ProfileSocial, ProfileComment } from '../types/index.js'

export const profileSocialService = {
  getSocial: (profileId: string) =>
    apiClient.get<ProfileSocial>(`/profiles/${profileId}/social`),

  follow: (profileId: string) =>
    apiClient.post<{ followed: boolean; followerCount: number }>(
      `/profiles/${profileId}/follow`,
      {},
    ),

  like: (profileId: string) =>
    apiClient.post<{ liked: boolean; likeCount: number }>(
      `/profiles/${profileId}/like`,
      {},
    ),

  getComments: (profileId: string) =>
    apiClient.get<ProfileComment[]>(`/profiles/${profileId}/comments`),

  postComment: (profileId: string, text: string) =>
    apiClient.post<ProfileComment>(`/profiles/${profileId}/comments`, { text }),

  deleteComment: (profileId: string, commentId: string) =>
    apiClient.delete<void>(`/profiles/${profileId}/comments/${commentId}`),
}
