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

  postComment: (eventId: string, text: string) =>
    apiClient.post<CommentResponse>(`/events/${eventId}/comments`, { text }),

  deleteComment: (eventId: string, commentId: string) =>
    apiClient.delete<void>(`/events/${eventId}/comments/${commentId}`),
}
