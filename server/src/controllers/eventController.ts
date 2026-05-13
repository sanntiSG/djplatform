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
        targetUrl: `/events/${serialized.slug ?? serialized.id}`,
      }).catch(() => {})
    }).catch(() => {})

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
