import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogService } from '../services/catalogService.js'

const STALE_TIME = 1000 * 60 * 5

export function useProfileTypes() {
  return useQuery({
    queryKey: ['catalogs', 'profile-types'],
    queryFn: catalogService.getProfileTypes,
    staleTime: STALE_TIME,
  })
}

export function useAdminProfileTypes() {
  return useQuery({
    queryKey: ['admin', 'profile-types'],
    queryFn: catalogService.adminListProfileTypes,
    staleTime: 0,
  })
}

function useInvalidateProfileTypes() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['catalogs', 'profile-types'] })
    qc.invalidateQueries({ queryKey: ['admin', 'profile-types'] })
  }
}

export function useCreateProfileType() {
  const invalidate = useInvalidateProfileTypes()
  return useMutation({
    mutationFn: (name: string) => catalogService.adminCreateProfileType(name),
    onSuccess: invalidate,
  })
}

export function useUpdateProfileType() {
  const invalidate = useInvalidateProfileTypes()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { isActive?: boolean; name?: string } }) =>
      catalogService.adminUpdateProfileType(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteProfileType() {
  const invalidate = useInvalidateProfileTypes()
  return useMutation({
    mutationFn: (id: string) => catalogService.adminDeleteProfileType(id),
    onSuccess: invalidate,
  })
}
