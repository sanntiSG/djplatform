import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentSocialService, type ContentSocialMap } from '../services/contentSocialService.js'
import type { ProfileComment } from '../types/index.js'

export function useProfileContentSocial(profileId: string) {
  return useQuery({
    queryKey: ['profiles', profileId, 'content-social'],
    queryFn: () => contentSocialService.getSocial(profileId),
    enabled: Boolean(profileId),
    staleTime: 10_000,
  })
}

export function useToggleContentLike(
  profileId: string,
  kind: 'photo' | 'media',
  targetId: string,
) {
  const qc = useQueryClient()
  const key = `${kind}:${targetId}`

  return useMutation({
    mutationFn: () => contentSocialService.like(profileId, kind, targetId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['profiles', profileId, 'content-social'] })
      const prev = qc.getQueryData<ContentSocialMap>(['profiles', profileId, 'content-social'])
      qc.setQueryData<ContentSocialMap>(['profiles', profileId, 'content-social'], (old) => {
        if (!old) return old
        const cur = old[key] ?? { likeCount: 0, commentCount: 0, isLiked: false }
        return {
          ...old,
          [key]: {
            ...cur,
            isLiked: !cur.isLiked,
            likeCount: cur.isLiked ? cur.likeCount - 1 : cur.likeCount + 1,
          },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['profiles', profileId, 'content-social'], ctx.prev)
      }
    },
    onSuccess: (result) => {
      qc.setQueryData<ContentSocialMap>(['profiles', profileId, 'content-social'], (old) => {
        if (!old) return old
        const cur = old[key] ?? { likeCount: 0, commentCount: 0, isLiked: false }
        return {
          ...old,
          [key]: { ...cur, isLiked: result.liked, likeCount: result.likeCount },
        }
      })
    },
  })
}

export function useContentComments(
  profileId: string,
  kind: 'photo' | 'media',
  targetId: string,
  enabled = false,
) {
  return useQuery({
    queryKey: ['profiles', profileId, 'content-comments', kind, targetId],
    queryFn: () => contentSocialService.getComments(profileId, kind, targetId),
    enabled: enabled && Boolean(profileId) && Boolean(targetId),
  })
}

export function usePostContentComment(
  profileId: string,
  kind: 'photo' | 'media',
  targetId: string,
) {
  const qc = useQueryClient()
  const key = `${kind}:${targetId}`

  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) =>
      contentSocialService.postComment(profileId, kind, targetId, text, parentId),
    onSuccess: (comment, variables) => {
      type C = ProfileComment & { replies?: C[] }
      if (!variables.parentId) {
        qc.setQueryData<C[]>(
          ['profiles', profileId, 'content-comments', kind, targetId],
          (old) => [comment as C, ...(old ?? [])],
        )
        qc.setQueryData<ContentSocialMap>(['profiles', profileId, 'content-social'], (old) => {
          if (!old) return old
          const cur = old[key] ?? { likeCount: 0, commentCount: 0, isLiked: false }
          return { ...old, [key]: { ...cur, commentCount: cur.commentCount + 1 } }
        })
      } else {
        qc.setQueryData<C[]>(
          ['profiles', profileId, 'content-comments', kind, targetId],
          (old) =>
            (old ?? []).map((c) =>
              c.id === variables.parentId
                ? { ...c, replies: [...(c.replies ?? []), comment as C] }
                : c,
            ),
        )
      }
    },
  })
}

export function useDeleteContentComment(
  profileId: string,
  kind: 'photo' | 'media',
  targetId: string,
) {
  const qc = useQueryClient()
  const key = `${kind}:${targetId}`

  return useMutation({
    mutationFn: (commentId: string) =>
      contentSocialService.deleteComment(profileId, kind, targetId, commentId),
    onSuccess: (_, commentId) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'content-comments', kind, targetId],
        (old) => (old ? old.filter((c) => c.id !== commentId) : old),
      )
      qc.setQueryData<ContentSocialMap>(['profiles', profileId, 'content-social'], (old) => {
        if (!old) return old
        const cur = old[key] ?? { likeCount: 0, commentCount: 0, isLiked: false }
        return { ...old, [key]: { ...cur, commentCount: Math.max(0, cur.commentCount - 1) } }
      })
    },
  })
}

export function useEditContentComment(
  profileId: string,
  kind: 'photo' | 'media',
  targetId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      contentSocialService.editComment(profileId, kind, targetId, commentId, text),
    onSuccess: (updated) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'content-comments', kind, targetId],
        (old) =>
          old
            ? old.map((c) => (c.id === updated.id ? { ...c, text: updated.text, editedAt: updated.editedAt } : c))
            : old,
      )
    },
  })
}

export function useToggleContentCommentLike(
  profileId: string,
  kind: 'photo' | 'media',
  targetId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      contentSocialService.likeComment(profileId, kind, targetId, commentId),
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: ['profiles', profileId, 'content-comments', kind, targetId] })
      const prev = qc.getQueryData<ProfileComment[]>(['profiles', profileId, 'content-comments', kind, targetId])
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'content-comments', kind, targetId],
        (old) =>
          old
            ? old.map((c) =>
                c.id === commentId
                  ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
                  : c,
              )
            : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['profiles', profileId, 'content-comments', kind, targetId], ctx.prev)
    },
    onSuccess: (result, commentId) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'content-comments', kind, targetId],
        (old) =>
          old
            ? old.map((c) =>
                c.id === commentId ? { ...c, isLiked: result.liked, likeCount: result.likeCount } : c,
              )
            : old,
      )
    },
  })
}
