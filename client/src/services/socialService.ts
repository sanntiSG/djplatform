import { apiClient } from './apiClient.js'
import type { CommentResponse, SocialStats } from '../types/index.js'

export const socialService = {
  getStats: (eventId: string) =>
    apiClient.get<SocialStats>(`/events/${eventId}/social`),

  toggleLike: (eventId: string) =>
    apiClient.post<{ liked: boolean; count: number }>(`/events/${eventId}/like`, {}),

  toggleAttend: (eventId: string) =>
    apiClient.post<{ attending: boolean; count: number }>(`/events/${eventId}/attend`, {}),

  getComments: (eventId: string) =>
    apiClient.get<CommentResponse[]>(`/events/${eventId}/comments`),

  postComment: (eventId: string, text: string, parentId?: string) =>
    apiClient.post<CommentResponse>(`/events/${eventId}/comments`, { text, ...(parentId ? { parentId } : {}) }),

  editComment: (eventId: string, commentId: string, text: string) =>
    apiClient.patch<CommentResponse>(`/events/${eventId}/comments/${commentId}`, { text }),

  likeComment: (eventId: string, commentId: string) =>
    apiClient.post<{ liked: boolean; likeCount: number }>(
      `/events/${eventId}/comments/${commentId}/like`,
      {},
    ),

  deleteComment: (eventId: string, commentId: string) =>
    apiClient.delete<void>(`/events/${eventId}/comments/${commentId}`),
}
