import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsService, type MessageItem } from '../services/conversationsService.js'

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      conversationsService.getMessages(conversationId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (firstPage) =>
      firstPage.length === 40 ? firstPage[0]?._id : undefined,
    select: (data) => ({
      ...data,
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  })
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, replyTo }: { body: string; replyTo?: string }) =>
      conversationsService.sendMessage(conversationId, body, replyTo),
    onSuccess: (msg) => {
      qc.setQueryData<{ pages: MessageItem[][]; pageParams: unknown[] }>(
        ['messages', conversationId],
        old => {
          if (!old) return old
          const pages = [...old.pages]
          // pages[0] is always the most-recent page (initial fetch, no `before` cursor)
          if (!pages[0]) return old
          if (pages[0].some(m => m._id === msg._id)) return old
          pages[0] = [...pages[0], msg]
          return { ...old, pages }
        },
      )
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
