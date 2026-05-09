import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { EventLike } from '../models/EventLike.js'
import { EventComment } from '../models/EventComment.js'
import { EventAttendance } from '../models/EventAttendance.js'
import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'
import { parseObjectId as parseId } from '../utils/parseId.js'

export async function toggleLike(eventId: string, userId: string) {
  const eid = parseId(eventId)
  const uid = parseId(userId)

  const existing = await EventLike.findOne({ eventId: eid, userId: uid })

  if (existing) {
    await EventLike.deleteOne({ _id: existing._id })
    const updated = await Event.findByIdAndUpdate(
      eid,
      { $inc: { likeCount: -1 } },
      { new: true },
    )
    return { liked: false, count: updated?.likeCount ?? 0 }
  }

  await EventLike.create({ eventId: eid, userId: uid })
  const updated = await Event.findByIdAndUpdate(
    eid,
    { $inc: { likeCount: 1 } },
    { new: true },
  )
  return { liked: true, count: updated?.likeCount ?? 0 }
}

export async function toggleAttend(eventId: string, userId: string) {
  const eid = parseId(eventId)
  const uid = parseId(userId)

  const existing = await EventAttendance.findOne({ eventId: eid, userId: uid })

  if (existing) {
    await EventAttendance.deleteOne({ _id: existing._id })
    const updated = await Event.findByIdAndUpdate(
      eid,
      { $inc: { attendCount: -1 } },
      { new: true },
    )
    return { attending: false, count: updated?.attendCount ?? 0 }
  }

  await EventAttendance.create({ eventId: eid, userId: uid })
  const updated = await Event.findByIdAndUpdate(
    eid,
    { $inc: { attendCount: 1 } },
    { new: true },
  )
  return { attending: true, count: updated?.attendCount ?? 0 }
}

export async function getSocialStats(eventId: string, userId?: string) {
  const eid = parseId(eventId)

  const [likeCount, attendCount, commentCount, userLiked, userAttending] = await Promise.all([
    EventLike.countDocuments({ eventId: eid }),
    EventAttendance.countDocuments({ eventId: eid }),
    EventComment.countDocuments({ eventId: eid }),
    userId
      ? EventLike.exists({ eventId: eid, userId: parseId(userId) })
      : Promise.resolve(null),
    userId
      ? EventAttendance.exists({ eventId: eid, userId: parseId(userId) })
      : Promise.resolve(null),
  ])

  return {
    likeCount,
    attendCount,
    commentCount,
    userLiked: Boolean(userLiked),
    userAttending: Boolean(userAttending),
  }
}

export async function listComments(eventId: string, userId?: string): Promise<unknown[]> {
  const eid = parseId(eventId)
  const comments = await EventComment.find({ eventId: eid, parentId: null })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()

  const commentIds = comments.map((c) => c._id)
  const replies = await EventComment.find({ parentId: { $in: commentIds } })
    .sort({ createdAt: 1 })
    .lean()

  const replyMap = new Map<string, typeof replies>()
  for (const r of replies) {
    const parentKey = r.parentId!.toString()
    if (!replyMap.has(parentKey)) replyMap.set(parentKey, [])
    replyMap.get(parentKey)!.push(r)
  }

  return comments.map((c) => ({
    ...c,
    replies: replyMap.get(c._id.toString()) ?? [],
    isOwn: userId ? c.userId.toString() === userId : false,
    isLiked: userId ? c.likedBy.some((id) => id.toString() === userId) : false,
  }))
}

export async function addComment(eventId: string, userId: string, text: string, parentId?: string) {
  const eid = parseId(eventId)
  const uid = parseId(userId)

  const user = await User.findById(uid).select('email').lean()
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })

  const comment = await EventComment.create({
    eventId: eid,
    userId: uid,
    userEmail: user.email,
    text: text.trim(),
    parentId: parentId ? parseId(parentId) : null,
  })

  if (!parentId) {
    await Event.findByIdAndUpdate(eid, { $inc: { commentCount: 1 } })
  }

  return comment
}

export async function editComment(commentId: string, userId: string, text: string) {
  const comment = await EventComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })
  if (comment.userId.toString() !== userId) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }
  comment.text = text.trim()
  comment.editedAt = new Date()
  await comment.save()
  return comment
}

export async function toggleCommentLike(commentId: string, userId: string) {
  const comment = await EventComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })

  const alreadyLiked = comment.likedBy.some((id) => id.toString() === userId)

  if (alreadyLiked) {
    comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId)
    comment.likeCount = Math.max(0, comment.likeCount - 1)
  } else {
    comment.likedBy.push(new mongoose.Types.ObjectId(userId))
    comment.likeCount += 1
  }

  await comment.save()
  return { liked: !alreadyLiked, likeCount: comment.likeCount }
}

export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin: boolean,
  eventOwnerId?: string,
) {
  const comment = await EventComment.findById(commentId)
  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })

  const isAuthor = comment.userId.toString() === userId
  const isOwner = eventOwnerId === userId

  if (!isAuthor && !isAdmin && !isOwner) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }

  await EventComment.deleteOne({ _id: comment._id })
  if (!comment.parentId) {
    await Event.findByIdAndUpdate(comment.eventId, { $inc: { commentCount: -1 } })
  }
}

export async function getEventOwnerId(eventId: string): Promise<string | undefined> {
  const event = await Event.findById(eventId).select('profileId').lean()
  if (!event) return undefined
  const profile = await Profile.findById(event.profileId).select('userId').lean()
  return profile?.userId?.toString()
}
