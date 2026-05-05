import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileSocialService } from '../services/profileSocialService.js'
import type { ProfileSocial, ProfileComment } from '../types/index.js'

export function useProfileSocial(profileId: string) {
  return useQuery({
    queryKey: ['profiles', profileId, 'social'],
    queryFn: () => profileSocialService.getSocial(profileId),
    enabled: Boolean(profileId),
    staleTime: 30_000,
  })
}

export function useFollow(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => profileSocialService.follow(profileId),
    onSuccess: (result) => {
      qc.setQueryData<ProfileSocial>(
        ['profiles', profileId, 'social'],
        (old) =>
          old
            ? { ...old, isFollowing: result.followed, followerCount: result.followerCount }
            : old,
      )
    },
  })
}

export function useProfileLike(profileId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => profileSocialService.like(profileId),
    onSuccess: (result) => {
      qc.setQueryData<ProfileSocial>(
        ['profiles', profileId, 'social'],
        (old) =>
          old ? { ...old, isLiked: result.liked, likeCount: result.likeCount } : old,
      )
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
  return useMutation({
    mutationFn: (text: string) => profileSocialService.postComment(profileId, text),
    onSuccess: (comment) => {
      qc.setQueryData<ProfileComment[]>(
        ['profiles', profileId, 'comments'],
        (old) => (old ? [comment, ...old] : [comment]),
      )
      qc.setQueryData<ProfileSocial>(
        ['profiles', profileId, 'social'],
        (old) => (old ? { ...old, commentCount: old.commentCount + 1 } : old),
      )
    },
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
  })
}
