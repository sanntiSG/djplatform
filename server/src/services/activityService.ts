import { ActivityEvent, type ActivityEventType } from '../models/ActivityEvent.js'
import { toSlug } from '../utils/slug.js'
import { logger } from '../utils/logger.js'
import { io } from '../realtime/io.js'

export interface CreateActivityInput {
  type: ActivityEventType
  actorProfileId: string
  actorName: string
  actorAvatar?: string
  targetTitle?: string
  targetUrl?: string
}

export async function createActivity(input: CreateActivityInput): Promise<void> {
  try {
    const actorSlug = toSlug(input.actorName)
    const doc = await ActivityEvent.create({ ...input, actorSlug })

    // Broadcast to all connected clients so the activity feed updates instantly
    const payload = {
      id: doc._id.toString(),
      type: doc.type,
      actorProfileId: doc.actorProfileId.toString(),
      actorName: doc.actorName,
      actorAvatar: doc.actorAvatar,
      actorSlug: doc.actorSlug,
      targetTitle: doc.targetTitle,
      targetUrl: doc.targetUrl,
      createdAt: doc.createdAt.toISOString(),
      isExternal: false,
    }
    io.emit('activity:new', payload)
  } catch (err) {
    logger.warn('activityService.createActivity failed (non-fatal)', { type: input.type, err })
  }
}

export async function getRecentActivity(limit = 20) {
  const events = await ActivityEvent.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return events.map(e => ({
    id: e._id.toString(),
    type: e.type,
    actorProfileId: e.actorProfileId.toString(),
    actorName: e.actorName,
    actorAvatar: e.actorAvatar,
    actorSlug: e.actorSlug,
    targetTitle: e.targetTitle,
    targetUrl: e.targetUrl,
    createdAt: e.createdAt.toISOString(),
  }))
}
