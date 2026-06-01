import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '../services/notificationsService.js'

export function useNotificationInbox() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notification-inbox'],
    queryFn: () => notificationsService.getInbox({ limit: 50 }),
    // Socket (notification:new) invalida la query en tiempo real; este intervalo es solo
    // un fallback por si se pierden eventos de reconexion. 15min es suficiente.
    refetchInterval: 15 * 60_000,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-inbox'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-inbox'] }),
  })

  const deleteOne = useMutation({
    mutationFn: (id: string) => notificationsService.deleteOne(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notification-inbox'] })
      const prev = queryClient.getQueryData(['notification-inbox'])
      queryClient.setQueryData(['notification-inbox'], (old: typeof query.data) => {
        if (!old) return old
        return { ...old, items: old.items.filter(n => n._id !== id) }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notification-inbox'], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notification-inbox'] }),
  })

  return { ...query, markRead: markRead.mutate, markAllRead: markAllRead.mutate, deleteOne: deleteOne.mutate }
}
