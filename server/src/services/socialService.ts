import { Event } from '../models/Event.js'
import { EventLike } from '../models/EventLike.js'
import { EventComment } from '../models/EventComment.js'
import { EventAttendance } from '../models/EventAttendance.js'
import { User } from '../models/User.js'
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

export async function listComments(eventId: string) {
  const eid = parseId(eventId)
  return EventComment.find({ eventId: eid }).sort({ createdAt: -1 }).limit(100).lean()
}

export async function addComment(eventId: string, userId: string, text: string) {
  const eid = parseId(eventId)
  const uid = parseId(userId)

  const user = await User.findById(uid).select('email').lean()
  if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })

  const comment = await EventComment.create({
    eventId: eid,
    userId: uid,
    userEmail: user.email,
    text: text.trim(),
  })

  await Event.findByIdAndUpdate(eid, { $inc: { commentCount: 1 } })

  return comment
}

export async function deleteComment(commentId: string, userId: string) {
  const uid = parseId(userId)
  const comment = await EventComment.findById(commentId)

  if (!comment) throw Object.assign(new Error('Comentario no encontrado'), { status: 404 })
  if (comment.userId.toString() !== uid.toString()) {
    throw Object.assign(new Error('Sin permiso'), { status: 403 })
  }

  await EventComment.deleteOne({ _id: comment._id })
  await Event.findByIdAndUpdate(comment.eventId, { $inc: { commentCount: -1 } })
}
