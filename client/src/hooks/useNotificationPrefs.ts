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
    onSuccess: (data) => {
      queryClient.setQueryData(['notification-prefs'], data)
    },
  })

  return { ...query, update: mutation.mutate, isUpdating: mutation.isPending }
}
