import { useEffect, useCallback, useRef } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectChatService, type ProjectMessageItem } from '../services/projectChatService.js'
import { socket } from '../services/socket.js'

/* ── Queries & mutations ─────────────────────────────────────── */

export function useProjectMessages(projectId: string, enabled = true) {
  const qc = useQueryClient()

  return useInfiniteQuery({
    queryKey:         ['project-chat', projectId],
    queryFn:          async ({ pageParam }) => {
      const res = await projectChatService.getMessages(projectId, pageParam as string | undefined)
      return res
    },
    getNextPageParam: (first) => {
      const msgs = first.messages
      return msgs.length === 40 ? msgs[0]._id : undefined
    },
    initialPageParam: undefined as string | undefined,
    enabled:          Boolean(projectId) && enabled,
    staleTime:        30_000,
  })
}

export function useSendProjectMessage(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, replyTo }: { body: string; replyTo?: string }) =>
      projectChatService.sendMessage(projectId, body, replyTo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-chat', projectId] })
    },
  })
}

export function useMarkProjectChatRead(projectId: string) {
  return useMutation({
    mutationFn: () => projectChatService.markRead(projectId),
  })
}

/* ── Socket hook ─────────────────────────────────────────────── */

export function useProjectChatSocket(projectId: string, conversationId: string | null) {
  const qc = useQueryClient()
  const convIdRef = useRef(conversationId)
  convIdRef.current = conversationId

  const onMessage = useCallback((data: { projectId: string; message: ProjectMessageItem }) => {
    if (data.projectId !== projectId) return
    qc.setQueryData<ReturnType<typeof useProjectMessages>['data']>(
      ['project-chat', projectId],
      (old) => {
        if (!old) return old
        const lastPage = old.pages[old.pages.length - 1]
        // Evitar duplicados
        const alreadyExists = old.pages.some((page) =>
          page.messages.some((m) => m._id === data.message._id),
        )
        if (alreadyExists) return old
        return {
          ...old,
          pages: [
            ...old.pages.slice(0, -1),
            { ...lastPage, messages: [...lastPage.messages, data.message] },
          ],
        }
      },
    )
  }, [projectId, qc])

  useEffect(() => {
    socket.on('project:message:new', onMessage)
    return () => { socket.off('project:message:new', onMessage) }
  }, [onMessage])

  // Presence: avisar al servidor que estamos viendo este chat
  useEffect(() => {
    if (!conversationId) return
    socket.emit('project:chat:viewing', { conversationId })
    return () => {
      socket.emit('project:chat:leave', { conversationId })
    }
  }, [conversationId])
}
