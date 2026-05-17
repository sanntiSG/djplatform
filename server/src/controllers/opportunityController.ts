import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Opportunity } from '../models/Opportunity.js'
import { Profile } from '../models/Profile.js'
import { Collaboration } from '../models/Collaboration.js'
import { parseObjectId } from '../utils/parseId.js'
import { createActivity } from '../services/activityService.js'
import { findOrCreateConversation, sendMessage } from '../services/conversationService.js'
import { create as createNotification } from '../services/notificationService.js'

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

interface ApplicantProfile {
  id: string
  artistName: string
  avatar?: string
  slug: string
}

function serialize(
  o: InstanceType<typeof Opportunity>,
  requestUserId?: string,
  applicants?: ApplicantProfile[],
) {
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
    applicants,
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

    let applicants: ApplicantProfile[] | undefined
    const isOwner = req.user && opp.userId.toString() === req.user.id
    if (isOwner && opp.applicantIds.length > 0) {
      const profiles = await Profile.find({ userId: { $in: opp.applicantIds } })
        .select('artistName avatar userId')
        .lean()
      applicants = profiles.map((p) => ({
        id: p._id.toString(),
        artistName: p.artistName,
        avatar: p.avatar,
        slug: p.artistName.toLowerCase().replace(/\s+/g, '-'),
      }))
    }

    res.json(serialize(opp, req.user?.id, applicants))
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

    const clientUrl = process.env.CLIENT_URL ?? 'https://resonar.ar'
    const oppUrl = `${clientUrl}/oportunidades/${opp._id}`
    const message = `Hola ${opp.artistName}, vi tu oportunidad "${opp.title}" en REsonar y me gustaria conectarme para hablar mas. Me podes contar mas detalles?\n\n${oppUrl}`

    await sendMessage(convId, req.user!.id, message, undefined, {
      type: 'opportunity',
      opportunityId: opp._id.toString(),
      title: opp.title,
      cover: undefined,
      status: opp.status,
    })

    if (!opp.applicantIds.some((id) => id.toString() === req.user!.id)) {
      opp.applicantIds.push(req.user!.id as any)
      await opp.save()
    }

    res.json({ conversationId: convId })
  } catch (err) {
    next(err)
  }
}

export async function acceptCollab(req: Request, res: Response, next: NextFunction) {
  try {
    const opp = await Opportunity.findById(parseObjectId(req.params.id))
    if (!opp || !opp.isVisible) {
      res.status(404).json({ error: 'Oportunidad no encontrada' }); return
    }
    if (opp.userId.toString() !== req.user!.id) {
      res.status(403).json({ error: 'Solo el publicador puede aceptar colaboraciones' }); return
    }

    const { collaboratorProfileId, collaboratorUserId } = req.body as {
      collaboratorProfileId?: string
      collaboratorUserId?: string
    }
    if (!collaboratorProfileId && !collaboratorUserId) {
      res.status(400).json({ error: 'collaboratorProfileId o collaboratorUserId requerido' }); return
    }

    const collaboratorProfile = collaboratorProfileId
      ? await Profile.findById(parseObjectId(collaboratorProfileId)).lean()
      : await Profile.findOne({ userId: collaboratorUserId }).lean()
    if (!collaboratorProfile) {
      res.status(404).json({ error: 'Perfil colaborador no encontrado' }); return
    }

    const publisherProfile = await Profile.findOne({ userId: req.user!.id }).lean()
    if (!publisherProfile) {
      res.status(404).json({ error: 'Perfil publicador no encontrado' }); return
    }

    const existing = await Collaboration.findOne({
      opportunityId: opp._id,
      $or: [
        { fromProfileId: publisherProfile._id, toProfileId: collaboratorProfile._id },
        { fromProfileId: collaboratorProfile._id, toProfileId: publisherProfile._id },
      ],
    })
    if (existing) {
      res.json({ ok: true, collaborationId: existing._id.toString() }); return
    }

    const collab = await Collaboration.create({
      fromProfileId: publisherProfile._id,
      toProfileId: collaboratorProfile._id,
      fromUserId: req.user!.id,
      toUserId: collaboratorProfile.userId,
      title: opp.title,
      year: new Date().getFullYear(),
      type: 'opportunity',
      opportunityId: opp._id,
      confirmedByA: true,
      confirmedByB: true,
      confirmedAt: new Date(),
    })

    if (opp.status === 'open') {
      opp.status = 'filled'
      await opp.save()
    }

    createNotification(
      collaboratorProfile.userId.toString(),
      'collab_confirmed',
      {
        actorId: req.user!.id,
        payload: { title: opp.title },
        url: `/p/${collaboratorProfile.artistName.toLowerCase().replace(/\s+/g, '-')}-${collaboratorProfile._id}`,
      },
    ).catch(() => { })

    res.json({ ok: true, collaborationId: collab._id.toString() })
  } catch (err) {
    next(err)
  }
}
