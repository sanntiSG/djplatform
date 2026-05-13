import mongoose from 'mongoose'
import { ProfileFollow } from '../models/ProfileFollow.js'
import { ProfileLike } from '../models/ProfileLike.js'
import { ProfileComment, type IProfileComment } from '../models/ProfileComment.js'
import { Profile } from '../models/Profile.js'

export async function getProfileSocialStats(profileId: string, userId?: string) {
  const pId = new mongoose.Types.ObjectId(profileId)
  const uId = userId ? new mongoose.Types.ObjectId(userId) : null

  const [followerCount, likeCount, commentCount, following, liked] = await Promise.all([
    ProfileFollow.countDocuments({ followedId: pId }),
    ProfileLike.countDocuments({ profileId: pId }),
    ProfileComment.countDocuments({ profileId: pId, parentId: null }),
    uId ? ProfileFollow.findOne({ followerId: uId, followedId: pId }).lean() : null,
    uId ? ProfileLike.findOne({ userId: uId, profileId: pId }).lean() : null,
  ])

  return {
    followerCount,
    likeCount,
    commentCount,
    isFollowing: !!following,
    isLiked: !!liked,
  }
}

export async function toggleFollow(
  followerId: string,
  followedId: string,
): Promise<{ followed: boolean; followerCount: number }> {
  const fId = new mongoose.Types.ObjectId(followerId)
  const bId = new mongoose.Types.ObjectId(followedId)

  const existing = await ProfileFollow.findOne({ followerId: fId, followedId: bId })
  if (existing) {
    await ProfileFollow.deleteOne({ _id: existing._id })
  } else {
    await ProfileFollow.create({ followerId: fId, followedId: bId })
  }
  const followerCount = await ProfileFollow.countDocuments({ followedId: bId })
  return { followed: !existing, followerCount }
}

export async function toggleLike(
  userId: string,
  profileId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const uId = new mongoose.Types.ObjectId(userId)
  const pId = new mongoose.Types.ObjectId(profileId)

  const existing = await ProfileLike.findOne({ userId: uId, profileId: pId })
  if (existing) {
    await ProfileLike.deleteOne({ _id: existing._id })
  } else {
    await ProfileLike.create({ userId: uId, profileId: pId })
  }
  const likeCount = await ProfileLike.countDocuments({ profileId: pId })
  return { liked: !existing, likeCount }
}

export async function getComments(profileId: string, userId?: string): Promise<unknown[]> {
  const roots = await ProfileComment.find({ profileId, parentId: null })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  const rootIds = roots.map((c) => c._id)
  const replies = await ProfileComment.find({ parentId: { $in: rootIds } })
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

export async function addComment(
  userId: string,
  profileId: string,
  userEmail: string,
  text: string,
  parentId?: string,
): Promise<IProfileComment> {
  return ProfileComment.create({
    userId: new mongoose.Types.ObjectId(userId),
    profileId: new mongoose.Types.ObjectId(profileId),
    userEmail,
    text,
    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  }) as unknown as IProfileComment
}

export async function editComment(
  commentId: string,
  userId: string,
  text: string,
): Promise<IProfileComment> {
  const comment = await ProfileComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })
  if (comment.userId.toString() !== userId) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }
  comment.text = text.trim()
  comment.editedAt = new Date()
  await comment.save()
  return comment as unknown as IProfileComment
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const comment = await ProfileComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })

  const uid = new mongoose.Types.ObjectId(userId)
  const alreadyLiked = (comment.likedBy ?? []).some((id: mongoose.Types.ObjectId) => id.toString() === userId)

  if (alreadyLiked) {
    comment.likedBy = (comment.likedBy ?? []).filter((id: mongoose.Types.ObjectId) => id.toString() !== userId)
    comment.likeCount = Math.max(0, (comment.likeCount ?? 0) - 1)
  } else {
    comment.likedBy = [...(comment.likedBy ?? []), uid]
    comment.likeCount = (comment.likeCount ?? 0) + 1
  }

  await comment.save()
  return { liked: !alreadyLiked, likeCount: comment.likeCount }
}

export async function deleteComment(
  userId: string,
  commentId: string,
  isAdmin: boolean,
  profileOwnerId?: string,
): Promise<void> {
  const comment = await ProfileComment.findById(commentId)
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
