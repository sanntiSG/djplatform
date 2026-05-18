import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Collaboration } from '../models/Collaboration.js'
import { Profile } from '../models/Profile.js'
import { parseObjectId } from '../utils/parseId.js'
import { createActivity } from '../services/activityService.js'
import { create as createNotification } from '../services/notificationService.js'

const RequestSchema = z.object({
  toProfileId: z.string().min(1),
  title: z.string().min(2).max(120).trim(),
  year: z.number().int().min(1990).max(2100).optional(),
  type: z.enum(['track', 'event', 'visual', 'other']).optional(),
})

function serialize(c: InstanceType<typeof Collaboration>) {
  return {
    id: c._id.toString(),
    fromProfileId: c.fromProfileId.toString(),
    toProfileId: c.toProfileId.toString(),
    fromUserId: c.fromUserId.toString(),
    toUserId: c.toUserId.toString(),
    title: c.title,
    year: c.year,
    type: c.type,
    confirmedByA: c.confirmedByA,
    confirmedByB: c.confirmedByB,
    confirmedAt: c.confirmedAt?.toISOString(),
    isConfirmed: c.confirmedByA && c.confirmedByB,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function request(req: Request, res: Response, next: NextFunction) {
  try {
    const { toProfileId, title, year, type } = RequestSchema.parse(req.body)

    const [fromProfile, toProfile] = await Promise.all([
      Profile.findOne({ userId: req.user!.id }).lean(),
      Profile.findById(parseObjectId(toProfileId)).lean(),
    ])
    if (!fromProfile) { res.status(400).json({ error: 'Necesitas un perfil para solicitar colaboracion' }); return }
    if (!toProfile) { res.status(404).json({ error: 'Perfil no encontrado' }); return }
    if (fromProfile._id.toString() === toProfileId) { res.status(400).json({ error: 'No puedes colaborar contigo mismo' }); return }

    // Prevent duplicate pending requests
    const existing = await Collaboration.findOne({
      fromProfileId: fromProfile._id,
      toProfileId: toProfile._id,
      confirmedByB: false,
    }).lean()
    if (existing) { res.status(409).json({ error: 'Ya enviaste una solicitud pendiente a este perfil' }); return }

    const collab = await Collaboration.create({
      fromProfileId: fromProfile._id,
      toProfileId: toProfile._id,
      fromUserId: req.user!.id,
      toUserId: toProfile.userId,
      title,
      year,
      type,
      confirmedByA: true,
      confirmedByB: false,
    })

    // Notify the recipient
    createNotification(toProfile.userId.toString(), 'collab_request', {
      actorId: req.user!.id,
      payload: { title, fromArtist: fromProfile.artistName },
    }).catch(() => {})

    res.status(201).json(serialize(collab))
  } catch (err) {
    next(err)
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const collab = await Collaboration.findById(parseObjectId(req.params.id))
    if (!collab) { res.status(404).json({ error: 'Colaboracion no encontrada' }); return }

    const myProfile = await Profile.findOne({ userId: req.user!.id }).lean()
    if (!myProfile) { res.status(403).json({ error: 'No tienes perfil' }); return }

    const isRecipient = collab.toProfileId.toString() === myProfile._id.toString()
    if (!isRecipient) { res.status(403).json({ error: 'No autorizado' }); return }
    if (collab.confirmedByB) { res.status(409).json({ error: 'Ya confirmada' }); return }

    collab.confirmedByB = true
    collab.confirmedAt = new Date()
    await collab.save()

    // Trigger activity and notification for requester
    const fromProfile = await Profile.findById(collab.fromProfileId).lean()
    if (fromProfile) {
      createActivity({
        type: 'collab_verified',
        actorProfileId: myProfile._id.toString(),
        actorName: myProfile.artistName,
        actorAvatar: myProfile.avatar,
        targetTitle: collab.title,
        targetUrl: `/p/${fromProfile._id}`,
        partnerName: fromProfile.artistName,
        partnerAvatar: fromProfile.avatar,
        partnerSlug: fromProfile.artistName.toLowerCase().replace(/\s+/g, '-'),
      }).catch(() => {})

      createNotification(collab.fromUserId.toString(), 'collab_confirmed', {
        actorId: req.user!.id,
        payload: { title: collab.title, fromArtist: myProfile.artistName },
      }).catch(() => {})
    }

    res.json(serialize(collab))
  } catch (err) {
    next(err)
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const collab = await Collaboration.findById(parseObjectId(req.params.id))
    if (!collab) { res.status(404).json({ error: 'Colaboracion no encontrada' }); return }

    const myProfile = await Profile.findOne({ userId: req.user!.id }).lean()
    if (!myProfile) { res.status(403).json({ error: 'No tienes perfil' }); return }

    const isFrom = collab.fromProfileId.toString() === myProfile._id.toString()
    const isTo = collab.toProfileId.toString() === myProfile._id.toString()
    if (!isFrom && !isTo) { res.status(403).json({ error: 'No autorizado' }); return }

    // Pending request: delete immediately
    if (!collab.confirmedByB) {
      await collab.deleteOne()
      res.json({ ok: true })
      return
    }

    // Confirmed collaboration: per-side hide
    if (isFrom) collab.hiddenForFrom = true
    if (isTo) collab.hiddenForTo = true

    if (collab.hiddenForFrom && collab.hiddenForTo) {
      await collab.deleteOne()
    } else {
      await collab.save()
    }

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function listForProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = parseObjectId(req.params.profileId)
    const isOwner = req.user
      ? (await Profile.findOne({ userId: req.user.id }).lean())?._id.toString() === profileId.toString()
      : false

    const visibleForProfile = {
      $or: [
        { fromProfileId: profileId, hiddenForFrom: { $ne: true } },
        { toProfileId: profileId, hiddenForTo: { $ne: true } },
      ],
    }
    const filter = isOwner
      ? visibleForProfile
      : { ...visibleForProfile, confirmedByA: true, confirmedByB: true }

    const collabs = await Collaboration.find(filter)
      .sort({ confirmedAt: -1, createdAt: -1 })
      .limit(50)
      .lean()

    // Populate artist names
    const profileIds = [...new Set(collabs.flatMap((c) => [c.fromProfileId.toString(), c.toProfileId.toString()]))]
    const profiles = await Profile.find({ _id: { $in: profileIds } }).select('artistName avatar').lean()
    const profileMap = Object.fromEntries(profiles.map((p) => [p._id.toString(), p]))

    const result = collabs.map((c) => ({
      id: c._id.toString(),
      fromProfileId: c.fromProfileId.toString(),
      toProfileId: c.toProfileId.toString(),
      fromArtistName: profileMap[c.fromProfileId.toString()]?.artistName ?? '?',
      fromAvatar: profileMap[c.fromProfileId.toString()]?.avatar,
      toArtistName: profileMap[c.toProfileId.toString()]?.artistName ?? '?',
      toAvatar: profileMap[c.toProfileId.toString()]?.avatar,
      title: c.title,
      year: c.year,
      type: c.type,
      opportunityId: c.opportunityId?.toString(),
      confirmedByA: c.confirmedByA,
      confirmedByB: c.confirmedByB,
      isConfirmed: c.confirmedByA && c.confirmedByB,
      confirmedAt: c.confirmedAt ? new Date(c.confirmedAt).toISOString() : undefined,
    }))

    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function listTrending(req: Request, res: Response, next: NextFunction) {
  try {
    const days = Math.min(Number(req.query.days ?? 7), 30)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const collabs = await Collaboration.find({
      confirmedByA: true,
      confirmedByB: true,
      confirmedAt: { $gte: since },
    })
      .sort({ confirmedAt: -1 })
      .limit(20)
      .lean()

    if (collabs.length === 0) { res.json({ items: [] }); return }

    const profileIds = [...new Set(collabs.flatMap((c) => [c.fromProfileId.toString(), c.toProfileId.toString()]))]
    const profiles = await Profile.find({ _id: { $in: profileIds } }).select('artistName avatar').lean()
    const profileMap = Object.fromEntries(profiles.map((p) => [p._id.toString(), p]))

    res.json({
      items: collabs.map((c) => ({
        id: c._id.toString(),
        fromArtistName: profileMap[c.fromProfileId.toString()]?.artistName ?? '?',
        fromAvatar: profileMap[c.fromProfileId.toString()]?.avatar,
        toArtistName: profileMap[c.toProfileId.toString()]?.artistName ?? '?',
        toAvatar: profileMap[c.toProfileId.toString()]?.avatar,
        title: c.title,
        type: c.type,
        confirmedAt: c.confirmedAt ? new Date(c.confirmedAt).toISOString() : new Date().toISOString(),
        fromProfileId: c.fromProfileId.toString(),
        toProfileId: c.toProfileId.toString(),
      })),
    })
  } catch (err) {
    next(err)
  }
}

export async function listPending(req: Request, res: Response, next: NextFunction) {
  try {
    const myProfile = await Profile.findOne({ userId: req.user!.id }).lean()
    if (!myProfile) { res.json([]); return }

    const pending = await Collaboration.find({
      toProfileId: myProfile._id,
      confirmedByB: false,
    }).sort({ createdAt: -1 }).limit(20).lean()

    const fromIds = pending.map((c) => c.fromProfileId.toString())
    const profiles = await Profile.find({ _id: { $in: fromIds } }).select('artistName avatar').lean()
    const profileMap = Object.fromEntries(profiles.map((p) => [p._id.toString(), p]))

    res.json(pending.map((c) => ({
      id: c._id.toString(),
      fromProfileId: c.fromProfileId.toString(),
      fromArtistName: profileMap[c.fromProfileId.toString()]?.artistName ?? '?',
      fromAvatar: profileMap[c.fromProfileId.toString()]?.avatar,
      title: c.title,
      year: c.year,
      type: c.type,
      createdAt: c.createdAt.toISOString(),
    })))
  } catch (err) {
    next(err)
  }
}
