import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService, type NotificationPreferences } from '../services/notificationsService.js'

export function useNotificationTypes() {
  return useQuery({
    queryKey: ['notification-types'],
    queryFn: () => notificationsService.getTypes(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useNotificationPrefs() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => notificationsService.getPreferences(),
    staleTime: 1000 * 60 * 5,
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences & { overrides: Record<string, boolean> }>) =>
      notificationsService.updatePreferences(data),
    onMutate: async (data) => {
      // Cancel in-flight fetches so they don't overwrite our optimistic state
      await queryClient.cancelQueries({ queryKey: ['notification-prefs'] })
      const previous = queryClient.getQueryData<NotificationPreferences>(['notification-prefs'])
      // Optimistic update — merge the partial data immediately
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(['notification-prefs'], {
          ...previous,
          ...data,
          overrides: { ...previous.overrides, ...(data.overrides ?? {}) },
        })
      }
      return { previous }
    },
    onError: (_err, _data, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['notification-prefs'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] })
    },
  })

  return { ...query, update: mutation.mutate, isUpdating: mutation.isPending }
}
