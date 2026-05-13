import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService, type NotificationPreferences, type NotificationType } from '../services/notificationsService.js'

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
      await queryClient.cancelQueries({ queryKey: ['notification-types'] })

      const previousPrefs = queryClient.getQueryData<NotificationPreferences>(['notification-prefs'])
      const previousTypes = queryClient.getQueryData<NotificationType[]>(['notification-types'])

      // Optimistic update — merge the partial data into prefs immediately
      if (previousPrefs) {
        queryClient.setQueryData<NotificationPreferences>(['notification-prefs'], {
          ...previousPrefs,
          ...data,
          overrides: { ...previousPrefs.overrides, ...(data.overrides ?? {}) },
        })
      }

      // Optimistic update — also update the notification-types cache so TypeRow toggles
      // reflect the change immediately (userEnabled comes from this query)
      if (previousTypes && data.overrides) {
        queryClient.setQueryData<NotificationType[]>(['notification-types'], previousTypes.map(t => {
          const overrideVal = data.overrides?.[t.key]
          if (overrideVal !== undefined) {
            return { ...t, userEnabled: overrideVal }
          }
          return t
        }))
      }

      // If notificationLevel changed, update 'all' category types accordingly
      if (previousTypes && data.notificationLevel) {
        queryClient.setQueryData<NotificationType[]>(['notification-types'], (prev) =>
          (prev ?? previousTypes).map(t => {
            if (t.category === 'all') {
              // Check if user has an explicit override for this key
              const overrides = { ...previousPrefs?.overrides, ...(data.overrides ?? {}) }
              if (overrides[t.key] !== undefined) return { ...t, userEnabled: overrides[t.key] }
              return { ...t, userEnabled: data.notificationLevel === 'all' }
            }
            return t
          }),
        )
      }

      return { previousPrefs, previousTypes }
    },
    onError: (_err, _data, context) => {
      // Rollback on error
      if (context?.previousPrefs) {
        queryClient.setQueryData(['notification-prefs'], context.previousPrefs)
      }
      if (context?.previousTypes) {
        queryClient.setQueryData(['notification-types'], context.previousTypes)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] })
      queryClient.invalidateQueries({ queryKey: ['notification-types'] })
    },
  })

  return {
    ...query,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
    updateError: mutation.isError,
    resetUpdateError: mutation.reset,
  }
}
