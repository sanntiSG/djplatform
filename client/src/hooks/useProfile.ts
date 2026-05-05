import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '../services/profileService.js'
import { useAuthStore } from '../store/useAuthStore.js'
import type { CreateProfileInput, UpdateProfileInput, ProfileResponse } from '../types/index.js'

export interface ProfileFilters {
  type?: string
  location?: string
  genres?: string[]
  eventTypes?: string[]
  availability?: string
  q?: string
}

export function useProfiles(filters: ProfileFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['profiles', 'list', filters],
    queryFn: ({ pageParam }) =>
      profileService.list({ ...filters, cursor: pageParam as string | undefined, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 20) return undefined
      return lastPage[lastPage.length - 1].id
    },
  })
}

export function useMyProfile() {
  const { token } = useAuthStore()
  return useQuery({
    queryKey: ['profiles', 'me'],
    queryFn: profileService.getMine,
    enabled: Boolean(token),
    retry: false,
  })
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: ['profiles', id],
    queryFn: () => profileService.getById(id),
    enabled: Boolean(id),
  })
}

export function useCreateProfile() {
  const qc = useQueryClient()
  const { user, setAuth, token } = useAuthStore()
  return useMutation({
    mutationFn: (data: CreateProfileInput) => profileService.create(data),
    onSuccess: (profile) => {
      qc.setQueryData(['profiles', 'me'], profile)
      if (user && token) {
        setAuth(token, { ...user, profileId: profile.id })
      }
    },
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => profileService.updateMine(data),
    onSuccess: (profile) => {
      qc.setQueryData(['profiles', 'me'], profile)
      // The public profile cache key uses the full "slug-id" format from profilePath()
      qc.setQueryData(['profiles', `${profile.slug}-${profile.id}`], profile)
    },
  })
}
