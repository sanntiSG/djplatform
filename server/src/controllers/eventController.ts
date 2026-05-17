import type { Request, Response, NextFunction } from 'express'
import { CreateEventSchema, UpdateEventSchema } from '@dj/shared'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  listEvents,
  listEventsByProfile,
  serializeEvent,
} from '../services/eventService.js'
import { parseObjectId } from '../utils/parseId.js'
import { createActivity } from '../services/activityService.js'
import { Profile } from '../models/Profile.js'
import { EventAttendance } from '../models/EventAttendance.js'
import { User } from '../models/User.js'

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateEventSchema.parse(req.body)
    const event = await createEvent(req.user!.id, data)
    const serialized = serializeEvent(event)

    // Fire activity event (non-blocking)
    Profile.findOne({ userId: req.user!.id }).lean().then(profile => {
      if (!profile) return
      const pid = (profile._id as { toString(): string }).toString()
      createActivity({
        type: 'event_published',
        actorProfileId: pid,
        actorName: profile.artistName,
        actorAvatar: profile.avatar,
        targetTitle: serialized.title,
        targetUrl: `/events/${serialized.slug}-${serialized.id}`,
        targetImage: serialized.cover,
      }).catch(() => { })
    }).catch(() => { })

    res.status(201).json(serialized)
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateEventSchema.parse(req.body)
    const event = await updateEvent(req.params.id, req.user!.id, data)
    if (!event) {
      res.status(404).json({ error: 'Evento no encontrado' })
      return
    }
    res.json(serializeEvent(event))
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteEvent(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await getEventById(parseObjectId(req.params.id))
    if (!event) {
      res.status(404).json({ error: 'Evento no encontrado' })
      return
    }
    res.json(serializeEvent(event))
  } catch (err) {
    next(err)
  }
}

export async function feed(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await listEvents(
      req.query.cursor as string | undefined,
      req.query.limit ? Number(req.query.limit) : 20,
    )
    res.json(events.map(serializeEvent))
  } catch (err) {
    next(err)
  }
}

export async function listByProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await listEventsByProfile(parseObjectId(req.params.id))
    res.json(events.map(serializeEvent))
  } catch (err) {
    next(err)
  }
}

export async function listAttendees(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = parseObjectId(req.params.id)

    // Verify the requesting user owns this event
    const event = await getEventById(eventId)
    if (!event) { res.status(404).json({ error: 'Evento no encontrado' }); return }

    const ownerProfile = await Profile.findById(event.profileId).lean()
    if (!ownerProfile || ownerProfile.userId.toString() !== req.user!.id) {
      res.status(403).json({ error: 'No autorizado' }); return
    }

    const attendances = await EventAttendance.find({ eventId }).lean()
    const userIds = attendances.map((a) => a.userId)

    // Join users → profiles
    const users = await User.find({ _id: { $in: userIds } }).select('_id').lean()
    const userIdSet = new Set(users.map((u) => u._id.toString()))

    const profiles = await Profile.find({ userId: { $in: Array.from(userIdSet) } })
      .select('artistName avatar userId')
      .lean()

    const result = profiles.map((p) => ({
      id: p._id.toString(),
      artistName: p.artistName,
      avatar: p.avatar,
      slug: p.artistName.toLowerCase().replace(/\s+/g, '-'),
    }))

    res.json(result)
  } catch (err) {
    next(err)
  }
}
