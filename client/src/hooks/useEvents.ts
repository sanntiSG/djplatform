import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService } from '../services/eventService.js'
import type { CreateEventInput, UpdateEventInput } from '../types/index.js'

export function useEventsFeed() {
  return useInfiniteQuery({
    queryKey: ['events', 'feed'],
    queryFn: ({ pageParam }) => eventService.feed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 20) return undefined
      return lastPage[lastPage.length - 1].id
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getById(id),
    enabled: Boolean(id),
  })
}

export function useProfileEvents(profileId: string) {
  return useQuery({
    queryKey: ['events', 'byProfile', profileId],
    queryFn: () => eventService.listByProfile(profileId),
    enabled: Boolean(profileId),
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEventInput) => eventService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', 'feed'] })
    },
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventInput }) =>
      eventService.update(id, data),
    onSuccess: (event) => {
      qc.setQueryData(['events', event.id], event)
      qc.invalidateQueries({ queryKey: ['events', 'feed'] })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
