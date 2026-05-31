import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileSocialService } from '../services/profileSocialService.js'
import { useToastStore } from '../store/useToastStore.js'
import { LIKED_PROFILES_KEY } from './useLikedProfiles.js'
import type { ProfileSocial, ProfileComment } from '../types/index.js'

const errToast = () => useToastStore.getState().show('No se pudo guardar. Intenta de nuevo.')

export function useProfileSocial(profileId: string) {
  return useQuery({
    queryKey: ['profiles', profileId, 'social'],
    queryFn: () => profileSocialService.getSocial(profileId),
    enabled: Boolean(profileId),
    staleTime: 10_000,
  })
}

export function useFollow(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => profileSocialService.follow(profileId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['profiles', profileId, 'social'] })
      const prev = qc.getQueryData<ProfileSocial>(['profiles', profileId, 'social'])
      qc.setQueryData<ProfileSocial>(['profiles', profileId, 'social'], (old) =>
        old
          ? { ...old, isFollowing: !old.isFollowing, followerCount: old.isFollowing ? old.followerCount - 1 : old.followerCount + 1 }
          : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['profiles', profileId, 'social'], ctx.prev)
      errToast()
    },
    onSuccess: (result) => {
      qc.setQueryData<ProfileSocial>(['profiles', profileId, 'social'], (old) =>
        old ? { ...old, isFollowing: result.followed, followerCount: result.followerCount } : old,
      )
    },
  })
}

export function useProfileLike(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => profileSocialService.like(profileId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['profiles', profileId, 'social'] })
      const prev = qc.getQueryData<ProfileSocial>(['profiles', profileId, 'social'])
      qc.setQueryData<ProfileSocial>(['profiles', profileId, 'social'], (old) =>
        old
          ? { ...old, isLiked: !old.isLiked, likeCount: old.isLiked ? old.likeCount - 1 : old.likeCount + 1 }
          : old,
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['profiles', profileId, 'social'], ctx.prev)
      errToast()
    },
    onSuccess: (result) => {
      qc.setQueryData<ProfileSocial>(['profiles', profileId, 'social'], (old) =>
        old ? { ...old, isLiked: result.liked, likeCount: result.likeCount } : old,
      )
      // Keep the Library "Artistas" list in sync: refetch after any like toggle
      qc.invalidateQueries({ queryKey: LIKED_PROFILES_KEY })
    },
  })
}

export function useProfileComments(profileId: string) {
  return useQuery({
    queryKey: ['profiles', profileId, 'comments'],
    queryFn: () => profileSocialService.getComments(profileId),
    enabled: Boolean(profileId),
  })
}

export function usePostProfileComment(profileId: string) {
  const qc = useQueryClient()
  type C = ProfileComment & { replies?: C[] }
  return useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) =>
      profileSocialService.postComment(profileId, text, parentId),
    onSuccess: (comment, variables) => {
      if (!variables.parentId) {
        qc.setQueryData<C[]>(['profiles', profileId, 'comments'], (old) => [comment as C, ...(old ?? [])])
        qc.setQueryData<ProfileSocial>(['profiles', profileId, 'social'], (old) =>
          old ? { ...old, commentCount: old.commentCount + 1 } : old,
        )
      } else {
        qc.setQueryData<C[]>(['profiles', profileId, 'comments'], (old) =>
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

export function useDeleteProfileComment(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) =>
      profileSocialService.deleteComment(profileId, commentId),
    onSuccess: (_, commentId) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'comments'],
        (old) => (old ? old.filter((c) => c.id !== commentId) : old),
      )
      qc.setQueryData<ProfileSocial>(
        ['profiles', profileId, 'social'],
        (old) => (old ? { ...old, commentCount: Math.max(0, old.commentCount - 1) } : old),
      )
    },
    onError: () => errToast(),
  })
}

export function useEditProfileComment(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      profileSocialService.editComment(profileId, commentId, text),
    onSuccess: (updated) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'comments'],
        (old) =>
          old
            ? old.map((c) => (c.id === updated.id ? { ...c, text: updated.text, editedAt: updated.editedAt } : c))
            : old,
      )
    },
    onError: () => errToast(),
  })
}

export function useToggleProfileCommentLike(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => profileSocialService.likeComment(profileId, commentId),
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: ['profiles', profileId, 'comments'] })
      const prev = qc.getQueryData<ProfileComment[]>(['profiles', profileId, 'comments'])
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'comments'],
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
      if (ctx?.prev) qc.setQueryData(['profiles', profileId, 'comments'], ctx.prev)
      errToast()
    },
    onSuccess: (result, commentId) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'comments'],
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
