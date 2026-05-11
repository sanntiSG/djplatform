import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogService } from '../services/catalogService.js'

const STALE_TIME = 1000 * 60 * 5 // 5 min — allows admin-added genres to propagate faster

export function useCatalogs() {
  const genres = useQuery({
    queryKey: ['catalogs', 'genres'],
    queryFn: catalogService.getGenres,
    staleTime: STALE_TIME,
  })

  const eventTypes = useQuery({
    queryKey: ['catalogs', 'event-types'],
    queryFn: catalogService.getEventTypes,
    staleTime: STALE_TIME,
  })

  return { genres, eventTypes }
}

export function useAdminGenres() {
  return useQuery({
    queryKey: ['admin', 'genres'],
    queryFn: catalogService.adminListGenres,
    staleTime: 0,
  })
}

function useInvalidateGenres() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['catalogs', 'genres'] })
    qc.invalidateQueries({ queryKey: ['admin', 'genres'] })
  }
}

export function useCreateGenre() {
  const invalidate = useInvalidateGenres()
  return useMutation({
    mutationFn: (name: string) => catalogService.adminCreateGenre(name),
    onSuccess: invalidate,
  })
}

export function useUpdateGenre() {
  const invalidate = useInvalidateGenres()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { isActive?: boolean; name?: string } }) =>
      catalogService.adminUpdateGenre(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteGenre() {
  const invalidate = useInvalidateGenres()
  return useMutation({
    mutationFn: (id: string) => catalogService.adminDeleteGenre(id),
    onSuccess: invalidate,
  })
}
