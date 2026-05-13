import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../services/socket.js'
import { conversationsService } from '../services/conversationsService.js'
import type { MessageItem, ConversationItem } from '../services/conversationsService.js'

export function useChatSocket(conversationId?: string) {
  const qc = useQueryClient()

  // Stable ref for markRead so it doesn't cause re-renders
  const markReadNow = useCallback((cid: string) => {
    conversationsService.markRead(cid).catch(() => {})

    // Optimistically zero unread for this conversation in the list
    qc.setQueryData<ConversationItem[]>(['conversations'], old => {
      if (!old) return old
      return old.map(c => c._id === cid ? { ...c, unreadCount: 0 } : c)
    })

    // Recompute total unread from the updated conversations cache
    qc.setQueryData<{ total: number }>(['conversations-unread'], () => {
      const convs = qc.getQueryData<ConversationItem[]>(['conversations']) ?? []
      const total = convs.reduce((sum, c) => sum + (c._id === cid ? 0 : (c.unreadCount ?? 0)), 0)
      return { total }
    })
  }, [qc])

  useEffect(() => {
    const socket = getSocket()

    function onMessageNew({ conversationId: cid, message }: { conversationId: string; message: MessageItem }) {
      // Add message to the most-recent page (pages[0] in raw cache = initial fetch)
      qc.setQueryData<{ pages: MessageItem[][]; pageParams: unknown[] }>(
        ['messages', cid],
        old => {
          if (!old) return old
          const pages = [...old.pages]
          if (!pages[0]) return old
          if (pages[0].some(m => m._id === message._id)) return old
          pages[0] = [...pages[0], message]
          return { ...old, pages }
        },
      )

      if (conversationId === cid) {
        // Viewing this conversation: mark as read immediately
        markReadNow(cid)
      } else {
        // Not viewing: update list + badge so user sees the new message indicator
        qc.invalidateQueries({ queryKey: ['conversations'] })
        qc.invalidateQueries({ queryKey: ['conversations-unread'] })
      }
    }

    function onConversationRead({ conversationId: cid }: { conversationId: string }) {
      qc.invalidateQueries({ queryKey: ['messages', cid] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conversations-unread'] })
    }

    socket.on('message:new', onMessageNew)
    socket.on('conversation:read', onConversationRead)

    return () => {
      socket.off('message:new', onMessageNew)
      socket.off('conversation:read', onConversationRead)
    }
  }, [qc, conversationId, markReadNow])

  // Notify server about presence when viewing a specific conversation
  useEffect(() => {
    if (!conversationId) return
    const socket = getSocket()
    socket.emit('presence:viewing', { conversationId })
    return () => {
      socket.emit('presence:leave', { conversationId })
    }
  }, [conversationId])
}

export function useTypingSocket(conversationId: string) {
  const socket = getSocket()

  function emitTypingStart() {
    socket.emit('typing:start', { conversationId })
  }

  function emitTypingStop() {
    socket.emit('typing:stop', { conversationId })
  }

  return { emitTypingStart, emitTypingStop }
}
