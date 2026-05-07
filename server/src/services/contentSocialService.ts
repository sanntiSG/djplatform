import mongoose from 'mongoose'
import { ContentLike } from '../models/ContentLike.js'
import { ContentComment, type IContentComment } from '../models/ContentComment.js'
import { Profile } from '../models/Profile.js'

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
      { $match: { profileId: new mongoose.Types.ObjectId(profileId), targetId: { $in: allIds } } },
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
): Promise<IContentComment[]> {
  const docs = await ContentComment.find({
    profileId: new mongoose.Types.ObjectId(profileId),
    targetKind,
    targetId: new mongoose.Types.ObjectId(targetId),
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
  return docs as unknown as IContentComment[]
}

export async function addContentComment(
  userId: string,
  profileId: string,
  targetKind: TargetKind,
  targetId: string,
  userEmail: string,
  text: string,
): Promise<IContentComment> {
  return ContentComment.create({
    userId,
    profileId,
    targetKind,
    targetId,
    userEmail,
    text,
  }) as unknown as IContentComment
}

export async function deleteContentComment(
  userId: string,
  commentId: string,
  isAdmin: boolean,
): Promise<void> {
  const comment = await ContentComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })
  if (!isAdmin && comment.userId.toString() !== userId) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }
  await comment.deleteOne()
}
