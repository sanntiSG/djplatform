import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialService } from '../services/socialService.js'
import { useAuthStore } from '../store/useAuthStore.js'

export function useSocialStats(eventId: string) {
  return useQuery({
    queryKey: ['social', 'stats', eventId],
    queryFn: () => socialService.getStats(eventId),
    enabled: Boolean(eventId),
    staleTime: 1000 * 30,
  })
}

export function useToggleLike(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => socialService.toggleLike(eventId),
    onSuccess: (data) => {
      qc.setQueryData(['social', 'stats', eventId], (old: { likeCount: number; userLiked: boolean } | undefined) =>
        old ? { ...old, likeCount: data.count, userLiked: data.liked } : old,
      )
    },
  })
}

export function useToggleAttend(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => socialService.toggleAttend(eventId),
    onSuccess: (data) => {
      qc.setQueryData(['social', 'stats', eventId], (old: { attendCount: number; userAttending: boolean } | undefined) =>
        old ? { ...old, attendCount: data.count, userAttending: data.attending } : old,
      )
    },
  })
}

export function useComments(eventId: string) {
  return useQuery({
    queryKey: ['social', 'comments', eventId],
    queryFn: () => socialService.getComments(eventId),
    enabled: Boolean(eventId),
  })
}

export function usePostComment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => socialService.postComment(eventId, text),
    onSuccess: (comment) => {
      qc.setQueryData(
        ['social', 'comments', eventId],
        (old: { id: string }[] | undefined) => [comment, ...(old ?? [])],
      )
      qc.setQueryData(['social', 'stats', eventId], (old: { commentCount: number } | undefined) =>
        old ? { ...old, commentCount: old.commentCount + 1 } : old,
      )
    },
  })
}

export function useDeleteComment(eventId: string) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => socialService.deleteComment(eventId, commentId),
    onSuccess: (_data, commentId) => {
      qc.setQueryData(
        ['social', 'comments', eventId],
        (old: { id: string }[] | undefined) => (old ?? []).filter((c) => c.id !== commentId),
      )
      qc.setQueryData(['social', 'stats', eventId], (old: { commentCount: number } | undefined) =>
        old ? { ...old, commentCount: Math.max(0, old.commentCount - 1) } : old,
      )
    },
  })
}
