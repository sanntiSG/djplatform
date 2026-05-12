import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService.js'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getStats,
    refetchInterval: 60_000,
  })
}

export function useAdminProfiles(visible: 'all' | 'true' | 'false' = 'all') {
  return useQuery({
    queryKey: ['admin', 'profiles', visible],
    queryFn: () => adminService.listProfiles({ visible, limit: 50 }),
  })
}

export function useAdminSetProfileVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      adminService.setProfileVisibility(id, isVisible),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'profiles'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminDeleteProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteProfile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'profiles'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminEvents(visible: 'all' | 'true' | 'false' = 'all') {
  return useQuery({
    queryKey: ['admin', 'events', visible],
    queryFn: () => adminService.listEvents({ visible, limit: 50 }),
  })
}

export function useAdminSetEventVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      adminService.setEventVisibility(id, isVisible),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'events'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'events'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers({ limit: 50 }),
  })
}

export function useAdminDbStats() {
  return useQuery({
    queryKey: ['admin', 'db-stats'],
    queryFn: adminService.getDbStats,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

export function useCleanupInactiveProfiles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.cleanupInactiveProfiles,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'db-stats'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })
}
