import { ProfileFollow } from '../models/ProfileFollow.js'
import { ProfileLike } from '../models/ProfileLike.js'
import { ProfileComment, type IProfileComment } from '../models/ProfileComment.js'

export async function getProfileSocialStats(profileId: string, userId?: string) {
  const [followerCount, likeCount, commentCount, following, liked] = await Promise.all([
    ProfileFollow.countDocuments({ followedId: profileId }),
    ProfileLike.countDocuments({ profileId }),
    ProfileComment.countDocuments({ profileId }),
    userId ? ProfileFollow.findOne({ followerId: userId, followedId: profileId }).lean() : null,
    userId ? ProfileLike.findOne({ userId, profileId }).lean() : null,
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
  const existing = await ProfileFollow.findOne({ followerId, followedId })
  if (existing) {
    await existing.deleteOne()
  } else {
    await ProfileFollow.create({ followerId, followedId })
  }
  const followerCount = await ProfileFollow.countDocuments({ followedId })
  return { followed: !existing, followerCount }
}

export async function toggleLike(
  userId: string,
  profileId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await ProfileLike.findOne({ userId, profileId })
  if (existing) {
    await existing.deleteOne()
  } else {
    await ProfileLike.create({ userId, profileId })
  }
  const likeCount = await ProfileLike.countDocuments({ profileId })
  return { liked: !existing, likeCount }
}

export async function getComments(profileId: string): Promise<IProfileComment[]> {
  const docs = await ProfileComment.find({ profileId }).sort({ createdAt: -1 }).limit(50).lean()
  return docs as unknown as IProfileComment[]
}

export async function addComment(
  userId: string,
  profileId: string,
  userEmail: string,
  text: string,
): Promise<IProfileComment> {
  return ProfileComment.create({ userId, profileId, userEmail, text }) as unknown as IProfileComment
}

export async function deleteComment(
  userId: string,
  commentId: string,
  isAdmin: boolean,
): Promise<void> {
  const comment = await ProfileComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })
  if (!isAdmin && comment.userId.toString() !== userId) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }
  await comment.deleteOne()
}
