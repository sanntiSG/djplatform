import mongoose from 'mongoose'
import { ContentLike } from '../models/ContentLike.js'
import { ContentComment, type IContentComment } from '../models/ContentComment.js'
import { Profile } from '../models/Profile.js'
import * as notificationService from './notificationService.js'
import { toSlug } from '../utils/slug.js'

type TargetKind = 'photo' | 'media'

export interface ContentSocialStats {
  likeCount: number
  commentCount: number
  isLiked: boolean
}

export async function getProfileContentSocial(
  profileId: string,
  userId?: string,
): Promise<Record<string, ContentSocialStats>> {
  const profile = await Profile.findById(profileId).lean()
  if (!profile) return {}

  const photoIds = (profile.photos ?? [])
    .filter((p: unknown) => {
      const ph = p as { _id?: mongoose.Types.ObjectId }
      return !!ph._id
    })
    .map((p: unknown) => (p as { _id: mongoose.Types.ObjectId })._id)

  const mediaIds = (profile.media ?? [])
    .filter((m: unknown) => {
      const mi = m as { _id?: mongoose.Types.ObjectId }
      return !!mi._id
    })
    .map((m: unknown) => (m as { _id: mongoose.Types.ObjectId })._id)

  const allIds = [...photoIds, ...mediaIds]
  if (allIds.length === 0) return {}

  const [likeCounts, commentCounts, userLikes] = await Promise.all([
    ContentLike.aggregate([
      { $match: { profileId: new mongoose.Types.ObjectId(profileId), targetId: { $in: allIds } } },
      { $group: { _id: { kind: '$targetKind', id: '$targetId' }, count: { $sum: 1 } } },
    ]),
    ContentComment.aggregate([
      { $match: { profileId: new mongoose.Types.ObjectId(profileId), targetId: { $in: allIds }, parentId: null } },
      { $group: { _id: { kind: '$targetKind', id: '$targetId' }, count: { $sum: 1 } } },
    ]),
    userId
      ? ContentLike.find({
          userId: new mongoose.Types.ObjectId(userId),
          profileId: new mongoose.Types.ObjectId(profileId),
          targetId: { $in: allIds },
        }).lean()
      : [],
  ])

  const likeMap: Record<string, number> = {}
  for (const row of likeCounts) {
    likeMap[`${row._id.kind}:${row._id.id}`] = row.count
  }

  const commentMap: Record<string, number> = {}
  for (const row of commentCounts) {
    commentMap[`${row._id.kind}:${row._id.id}`] = row.count
  }

  const likedSet = new Set(
    userLikes.map((l) => `${l.targetKind}:${l.targetId.toString()}`),
  )

  const result: Record<string, ContentSocialStats> = {}

  for (const id of photoIds) {
    const key = `photo:${id}`
    result[key] = {
      likeCount: likeMap[key] ?? 0,
      commentCount: commentMap[key] ?? 0,
      isLiked: likedSet.has(key),
    }
  }
  for (const id of mediaIds) {
    const key = `media:${id}`
    result[key] = {
      likeCount: likeMap[key] ?? 0,
      commentCount: commentMap[key] ?? 0,
      isLiked: likedSet.has(key),
    }
  }

  return result
}

export async function toggleContentLike(
  userId: string,
  profileId: string,
  targetKind: TargetKind,
  targetId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await ContentLike.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    profileId: new mongoose.Types.ObjectId(profileId),
    targetKind,
    targetId: new mongoose.Types.ObjectId(targetId),
  })

  if (existing) {
    await existing.deleteOne()
  } else {
    await ContentLike.create({
      userId,
      profileId,
      targetKind,
      targetId,
    })

    // Notify owner
    const profile = await Profile.findById(profileId).select('userId artistName').lean()
    if (profile && profile.userId.toString() !== userId) {
      const typeKey = targetKind === 'photo' ? 'content_like' : 'media_like'
      const slug = toSlug(profile.artistName)
      const url = `/p/${slug}-${profile._id.toString()}`
      notificationService.create(profile.userId.toString(), typeKey, {
        actorId: userId,
        url,
      }).catch(() => {})
    }
  }

  const likeCount = await ContentLike.countDocuments({
    profileId: new mongoose.Types.ObjectId(profileId),
    targetKind,
    targetId: new mongoose.Types.ObjectId(targetId),
  })

  return { liked: !existing, likeCount }
}

export async function getContentComments(
  profileId: string,
  targetKind: TargetKind,
  targetId: string,
  userId?: string,
): Promise<unknown[]> {
  const pid = new mongoose.Types.ObjectId(profileId)
  const tid = new mongoose.Types.ObjectId(targetId)

  const roots = await ContentComment.find({ profileId: pid, targetKind, targetId: tid, parentId: null })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const rootIds = roots.map((c) => c._id)
  const replies = await ContentComment.find({ parentId: { $in: rootIds } })
    .sort({ createdAt: 1 })
    .lean()

  const replyMap = new Map<string, typeof replies>()
  for (const r of replies) {
    const parentKey = r.parentId!.toString()
    if (!replyMap.has(parentKey)) replyMap.set(parentKey, [])
    replyMap.get(parentKey)!.push(r)
  }

  return roots.map((c) => ({
    ...c,
    replies: replyMap.get(c._id.toString()) ?? [],
    isOwn: userId ? c.userId.toString() === userId : false,
    isLiked: userId ? (c.likedBy ?? []).some((id: mongoose.Types.ObjectId) => id.toString() === userId) : false,
  }))
}

export async function addContentComment(
  userId: string,
  profileId: string,
  targetKind: TargetKind,
  targetId: string,
  userEmail: string,
  text: string,
  parentId?: string,
): Promise<IContentComment> {
  const comment = await ContentComment.create({
    userId,
    profileId,
    targetKind,
    targetId,
    userEmail,
    text,
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  })

  // Notify owner
  const profile = await Profile.findById(profileId).select('userId artistName').lean()
  if (profile && profile.userId.toString() !== userId) {
    const slug = toSlug(profile.artistName)
    const url = `/p/${slug}-${profile._id.toString()}`
    notificationService.create(profile.userId.toString(), 'content_comment', {
      actorId: userId,
      payload: { text },
      url,
    }).catch(() => {})
  }

  return comment as unknown as IContentComment
}

export async function editContentComment(
  commentId: string,
  userId: string,
  text: string,
): Promise<IContentComment> {
  const comment = await ContentComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })
  if (comment.userId.toString() !== userId) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }
  comment.text = text.trim()
  comment.editedAt = new Date()
  await comment.save()
  return comment as unknown as IContentComment
}

export async function toggleContentCommentLike(
  commentId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const comment = await ContentComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })

  const uid = new mongoose.Types.ObjectId(userId)
  const alreadyLiked = (comment.likedBy ?? []).some((id) => id.toString() === userId)

  if (alreadyLiked) {
    comment.likedBy = (comment.likedBy ?? []).filter((id) => id.toString() !== userId)
    comment.likeCount = Math.max(0, (comment.likeCount ?? 0) - 1)
  } else {
    comment.likedBy = [...(comment.likedBy ?? []), uid]
    comment.likeCount = (comment.likeCount ?? 0) + 1
  }

  await comment.save()
  return { liked: !alreadyLiked, likeCount: comment.likeCount }
}

export async function deleteContentComment(
  userId: string,
  commentId: string,
  isAdmin: boolean,
  profileOwnerId?: string,
): Promise<void> {
  const comment = await ContentComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })

  const isAuthor = comment.userId.toString() === userId
  const isOwner = profileOwnerId === userId

  if (!isAuthor && !isAdmin && !isOwner) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }
  await comment.deleteOne()
}

export async function getProfileOwnerId(profileId: string): Promise<string | undefined> {
  const profile = await Profile.findById(profileId).select('userId').lean()
  return profile?.userId?.toString()
}
