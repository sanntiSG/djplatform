import { apiClient } from './apiClient.js'

// ── Tipos base ────────────────────────────────────────────────────────────────

export interface DMConversationItem {
  type: 'dm'
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

export interface ProjectConversationItem {
  type: 'project'
  _id: string
  projectId: string
  title: string
  phase: string
  coverSvgKey?: string
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageSenderId: string | null
  unreadCount: number
}

/** Backward-compat: el backend agrega type:'dm' al listado combinado */
export type ConversationItem = DMConversationItem | ProjectConversationItem

export interface MessageAttachmentOpportunity {
  type: 'opportunity'
  opportunityId: string
  title: string
  cover?: string
  status: 'open' | 'closed' | 'filled'
}

export interface MessageAttachmentProject {
  type: 'project'
  projectId: string
  title: string
  cover?: string
  applicantProfileId: string
}

export type MessageAttachment = MessageAttachmentOpportunity | MessageAttachmentProject

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

// ── Service ───────────────────────────────────────────────────────────────────

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
