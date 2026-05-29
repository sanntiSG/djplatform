import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savedMediaService } from '../services/savedMediaService.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { useToastStore } from '../store/useToastStore.js'

const SAVED_KEY = ['saved-media'] as const

export function useSavedMediaList(filters?: { genre?: string; artist?: string }) {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: [...SAVED_KEY, filters ?? {}],
    queryFn: () => savedMediaService.list(filters),
    enabled: Boolean(token),
    staleTime: 30_000,
  })
}

export function useSavedMediaIds() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: [...SAVED_KEY, {}],
    queryFn: () => savedMediaService.list(),
    enabled: Boolean(token),
    staleTime: 30_000,
    select: (data) => new Set(data.map((item) => item.mediaId)),
  })
}

export function useIsSaved(mediaId: string) {
  const { data: savedIds } = useSavedMediaIds()
  return savedIds?.has(mediaId) ?? false
}

export function useToggleSaveMedia(profileId: string, mediaId: string) {
  const qc = useQueryClient()
  const errToast = () => useToastStore.getState().show('No se pudo guardar. Intenta de nuevo.')

  return useMutation({
    mutationFn: () => savedMediaService.toggle(profileId, mediaId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: SAVED_KEY })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVED_KEY })
      qc.invalidateQueries({ queryKey: ['recommendations', 'songs'] })
    },
    onError: () => errToast(),
  })
}

export function useRemoveSavedMedia() {
  const qc = useQueryClient()
  const errToast = () => useToastStore.getState().show('No se pudo eliminar. Intenta de nuevo.')

  return useMutation({
    mutationFn: ({ profileId, mediaId }: { profileId: string; mediaId: string }) =>
      savedMediaService.remove(profileId, mediaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SAVED_KEY })
      qc.invalidateQueries({ queryKey: ['recommendations', 'songs'] })
    },
    onError: () => errToast(),
  })
}
