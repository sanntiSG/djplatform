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
          const lastPage = pages[pages.length - 1]
          pages[pages.length - 1] = [...lastPage, msg]
          return { ...old, pages }
        },
      )
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
