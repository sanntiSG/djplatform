import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Opportunity } from '../models/Opportunity.js'
import { Profile } from '../models/Profile.js'
import { parseObjectId } from '../utils/parseId.js'
import { createActivity } from '../services/activityService.js'
import { findOrCreateConversation, sendMessage } from '../services/conversationService.js'

const CreateOpportunitySchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  lookingForRoles: z.array(z.string().max(40)).max(6).default([]),
  genres: z.array(z.string()).max(10).default([]),
  location: z.string().max(100).optional(),
  eventDate: z.string().datetime().optional(),
  isPaid: z.boolean().default(false),
  isRemote: z.boolean().default(false),
})

const UpdateOpportunitySchema = CreateOpportunitySchema.partial().extend({
  status: z.enum(['open', 'closed', 'filled']).optional(),
})

function serialize(o: InstanceType<typeof Opportunity>, requestUserId?: string) {
  return {
    id: o._id.toString(),
    profileId: o.profileId.toString(),
    userId: o.userId.toString(),
    artistName: o.artistName,
    avatar: o.avatar,
    title: o.title,
    description: o.description,
    lookingForRoles: o.lookingForRoles,
    genres: o.genres,
    location: o.location,
    eventDate: o.eventDate?.toISOString(),
    isPaid: o.isPaid,
    isRemote: o.isRemote,
    status: o.status,
    applicantCount: o.applicantIds.length,
    isApplied: requestUserId
      ? o.applicantIds.some((id) => id.toString() === requestUserId)
      : false,
    createdAt: o.createdAt.toISOString(),
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, genre, location, isRemote, isPaid, status = 'open', limit = '20', cursor } = req.query as Record<string, string>

    const query: Record<string, unknown> = { isVisible: true, status }
    if (role) query.lookingForRoles = role
    if (genre) query.genres = genre
    if (location) query.location = { $regex: location, $options: 'i' }
    if (isRemote === 'true') query.isRemote = true
    if (isPaid === 'true') query.isPaid = true
    if (cursor) query._id = { $lt: cursor }

    const items = await Opportunity.find(query)
      .sort({ _id: -1 })
      .limit(Math.min(Number(limit), 50))
      .lean()

    res.json((items as any[]).map((o) => serialize(o as any, req.user?.id)))
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const opp = await Opportunity.findById(parseObjectId(req.params.id))
    if (!opp || !opp.isVisible) {
      res.status(404).json({ error: 'Oportunidad no encontrada' })
      return
    }
    res.json(serialize(opp, req.user?.id))
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateOpportunitySchema.parse(req.body)
    const profile = await Profile.findOne({ userId: req.user!.id })
    if (!profile) {
      res.status(403).json({ error: 'Necesitas un perfil para publicar oportunidades' })
      return
    }

    const opp = await Opportunity.create({
      ...data,
      profileId: profile._id,
      userId: req.user!.id,
      artistName: profile.artistName,
      avatar: profile.avatar,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
    })

    createActivity({
      type: 'opportunity_posted' as any,
      actorProfileId: profile._id.toString(),
      actorName: profile.artistName,
      actorAvatar: profile.avatar,
      targetTitle: opp.title,
      targetUrl: `/oportunidades/${opp._id}`,
    }).catch(() => { })

    res.status(201).json(serialize(opp, req.user!.id))
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateOpportunitySchema.parse(req.body)
    const opp = await Opportunity.findById(parseObjectId(req.params.id))
    if (!opp || !opp.isVisible) {
      res.status(404).json({ error: 'Oportunidad no encontrada' })
      return
    }
    if (opp.userId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permiso' })
      return
    }
    Object.assign(opp, { ...data, eventDate: data.eventDate ? new Date(data.eventDate) : opp.eventDate })
    await opp.save()
    res.json(serialize(opp, req.user!.id))
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const opp = await Opportunity.findById(parseObjectId(req.params.id))
    if (!opp) {
      res.status(404).json({ error: 'Oportunidad no encontrada' })
      return
    }
    if (opp.userId.toString() !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Sin permiso' })
      return
    }
    await opp.deleteOne()
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function apply(req: Request, res: Response, next: NextFunction) {
  try {
    const opp = await Opportunity.findById(parseObjectId(req.params.id))
    if (!opp || !opp.isVisible || opp.status !== 'open') {
      res.status(404).json({ error: 'Oportunidad no disponible' })
      return
    }

    if (opp.userId.toString() === req.user!.id) {
      res.status(400).json({ error: 'No podes aplicar a tu propia oportunidad' })
      return
    }

    const conv = await findOrCreateConversation(req.user!.id, opp.userId.toString())
    const convId = (conv._id as any).toString()

    const message = `Hola ${opp.artistName}, vi tu oportunidad "${opp.title}" en REsonar y me gustaria conectarme para hablar mas. Me podes contar mas detalles?`
    await sendMessage(convId, req.user!.id, message)

    if (!opp.applicantIds.some((id) => id.toString() === req.user!.id)) {
      opp.applicantIds.push(req.user!.id as any)
      await opp.save()
    }

    res.json({ conversationId: convId })
  } catch (err) {
    next(err)
  }
}
