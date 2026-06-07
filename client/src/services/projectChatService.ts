import { apiClient } from './apiClient.js'

export interface ProjectMessageItem {
  _id: string
  conversationId: string
  projectId: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  body: string
  replyTo: string | null
  readBy: string[]
  createdAt: string
}

export interface ProjectMessagesResponse {
  conversationId: string
  messages: ProjectMessageItem[]
}

export const projectChatService = {
  getMessages: (projectId: string, before?: string) =>
    apiClient.get<ProjectMessagesResponse>(
      `/projects/${projectId}/chat/messages${before ? `?before=${before}` : ''}`,
    ),

  sendMessage: (projectId: string, body: string, replyTo?: string) =>
    apiClient.post<ProjectMessageItem>(`/projects/${projectId}/chat/messages`, {
      body,
      ...(replyTo ? { replyTo } : {}),
    }),

  markRead: (projectId: string) =>
    apiClient.patch<{ ok: boolean }>(`/projects/${projectId}/chat/read`, {}),
}
