import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { socialService } from '../services/socialService.js'
import { useAuthStore } from '../store/useAuthStore.js'
import { useToastStore } from '../store/useToastStore.js'

const errToast = () => useToastStore.getState().show('No se pudo guardar. Intenta de nuevo.')

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
  type Stats = { likeCount: number; userLiked: boolean }
  return useMutation({
    mutationFn: () => socialService.toggleLike(eventId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['social', 'stats', eventId] })
      const prev = qc.getQueryData<Stats>(['social', 'stats', eventId])
      qc.setQueryData<Stats>(['social', 'stats', eventId], (old) =>
        old ? { ...old, userLiked: !old.userLiked, likeCount: old.userLiked ? old.likeCount - 1 : old.likeCount + 1 } : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['social', 'stats', eventId], ctx.prev)
      errToast()
    },
    onSuccess: (data) => {
      qc.setQueryData<Stats>(['social', 'stats', eventId], (old) =>
        old ? { ...old, likeCount: data.count, userLiked: data.liked } : old,
      )
    },
  })
}

export function useToggleAttend(eventId: string) {
  const qc = useQueryClient()
  type Stats = { attendCount: number; userAttending: boolean }
  return useMutation({
    mutationFn: () => socialService.toggleAttend(eventId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['social', 'stats', eventId] })
      const prev = qc.getQueryData<Stats>(['social', 'stats', eventId])
      qc.setQueryData<Stats>(['social', 'stats', eventId], (old) =>
        old ? { ...old, userAttending: !old.userAttending, attendCount: old.userAttending ? old.attendCount - 1 : old.attendCount + 1 } : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['social', 'stats', eventId], ctx.prev)
      errToast()
    },
    onSuccess: (data) => {
      qc.setQueryData<Stats>(['social', 'stats', eventId], (old) =>
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
  type C = { id: string; parentId?: string | null; replies?: C[] }
  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) =>
      socialService.postComment(eventId, text, parentId),
    onSuccess: (comment, variables) => {
      if (!variables.parentId) {
        qc.setQueryData<C[]>(['social', 'comments', eventId], (old) => [comment as C, ...(old ?? [])])
        qc.setQueryData(['social', 'stats', eventId], (old: { commentCount: number } | undefined) =>
          old ? { ...old, commentCount: old.commentCount + 1 } : old,
        )
      } else {
        qc.setQueryData<C[]>(['social', 'comments', eventId], (old) =>
          (old ?? []).map((c) =>
            c.id === variables.parentId
              ? { ...c, replies: [...(c.replies ?? []), comment as C] }
              : c,
          ),
        )
      }
    },
    onError: () => errToast(),
  })
}

export function useDeleteComment(eventId: string) {
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
    onError: () => errToast(),
  })
}

export function useEditComment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      socialService.editComment(eventId, commentId, text),
    onSuccess: (updated) => {
      qc.setQueryData(
        ['social', 'comments', eventId],
        (old: { id: string; text?: string; editedAt?: string | null }[] | undefined) =>
          (old ?? []).map((c) =>
            c.id === updated.id ? { ...c, text: updated.text, editedAt: updated.editedAt } : c,
          ),
      )
    },
    onError: () => errToast(),
  })
}

export function useToggleCommentLike(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => socialService.likeComment(eventId, commentId),
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: ['social', 'comments', eventId] })
      const prev = qc.getQueryData<{ id: string; likeCount: number; isLiked: boolean }[]>(['social', 'comments', eventId])
      qc.setQueryData(
        ['social', 'comments', eventId],
        (old: { id: string; likeCount: number; isLiked: boolean }[] | undefined) =>
          (old ?? []).map((c) =>
            c.id === commentId
              ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
              : c,
          ),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['social', 'comments', eventId], ctx.prev)
      errToast()
    },
    onSuccess: (result, commentId) => {
      qc.setQueryData(
        ['social', 'comments', eventId],
        (old: { id: string; likeCount: number; isLiked: boolean }[] | undefined) =>
          (old ?? []).map((c) =>
            c.id === commentId ? { ...c, isLiked: result.liked, likeCount: result.likeCount } : c,
          ),
      )
    },
  })
}
