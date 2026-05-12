import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '../services/socket.js'
import type { MessageItem } from '../services/conversationsService.js'

export function useChatSocket(conversationId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    function onMessageNew({ conversationId: cid, message }: { conversationId: string; message: MessageItem }) {
      qc.setQueryData<{ pages: MessageItem[][]; pageParams: unknown[] }>(
        ['messages', cid],
        old => {
          if (!old) return old
          const pages = [...old.pages]
          const lastPage = pages[pages.length - 1]
          // Avoid duplicates (optimistic update may have already added it)
          if (lastPage.some(m => m._id === message._id)) return old
          pages[pages.length - 1] = [...lastPage, message]
          return { ...old, pages }
        },
      )
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['conversations-unread'] })
    }

    function onConversationRead({ conversationId: cid }: { conversationId: string }) {
      qc.invalidateQueries({ queryKey: ['messages', cid] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    }

    socket.on('message:new', onMessageNew)
    socket.on('conversation:read', onConversationRead)

    return () => {
      socket.off('message:new', onMessageNew)
      socket.off('conversation:read', onConversationRead)
    }
  }, [qc])

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
