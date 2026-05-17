import { apiClient } from './apiClient.js'

export interface ConversationItem {
  _id: string
  otherUser: {
    _id: string
    artistName: string
    avatar: string | null
    slug: string | null
    profileId: string | null
  }
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageSenderId: string | null
  unreadCount: number
}

export interface MessageAttachment {
  type: 'opportunity'
  opportunityId: string
  title: string
  cover?: string
  status: 'open' | 'closed' | 'filled'
}

export interface MessageItem {
  _id: string
  conversationId: string
  senderId: string
  body: string
  replyTo?: string | null
  readBy: string[]
  attachment?: MessageAttachment
  createdAt: string
}

export const conversationsService = {
  start: (targetUserId: string) =>
    apiClient.post<{ _id: string }>('/conversations', { targetUserId }),

  list: () => apiClient.get<ConversationItem[]>('/conversations'),

  getMessages: (conversationId: string, before?: string, limit = 40) => {
    const qs = new URLSearchParams()
    if (before) qs.set('before', before)
    qs.set('limit', String(limit))
    return apiClient.get<MessageItem[]>(`/conversations/${conversationId}/messages?${qs}`)
  },

  sendMessage: (conversationId: string, body: string, replyTo?: string) =>
    apiClient.post<MessageItem>(`/conversations/${conversationId}/messages`, { body, replyTo }),

  markRead: (conversationId: string) =>
    apiClient.patch<{ ok: boolean }>(`/conversations/${conversationId}/read`, {}),

  getUnreadTotal: () => apiClient.get<{ total: number }>('/conversations/unread-total'),
}
