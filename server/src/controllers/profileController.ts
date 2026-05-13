import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { CreateProfileSchema, UpdateProfileSchema } from '@dj/shared'
import {
  createProfile,
  updateProfile,
  updateMediaItem,
  getProfileByUserId,
  getProfileById,
  listProfiles,
  getTopProfilesByFollowers,
  serializeProfile,
} from '../services/profileService.js'
import { Profile } from '../models/Profile.js'
import { parseObjectId } from '../utils/parseId.js'
import { createActivity } from '../services/activityService.js'

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CreateProfileSchema.parse(req.body)
    const profile = await createProfile(req.user!.id, data)
    const serialized = serializeProfile(profile)

    createActivity({
      type: 'profile_created',
      actorProfileId: serialized.id,
      actorName: serialized.artistName,
      actorAvatar: serialized.avatar,
      targetUrl: `/p/${serialized.slug}-${serialized.id}`,
    }).catch(() => {})

    res.status(201).json(serialized)
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await getProfileByUserId(req.user!.id)
    if (!profile) {
      res.status(404).json({ error: 'No tienes perfil creado' })
      return
    }
    res.json(serializeProfile(profile))
  } catch (err) {
    next(err)
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const data = UpdateProfileSchema.parse(req.body)
    const profile = await updateProfile(req.user!.id, data)
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }
    res.json(serializeProfile(profile))
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await getProfileById(parseObjectId(req.params.id))
    if (!profile || (!profile.isVisible && req.user?.role !== 'admin')) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }
    res.json(serializeProfile(profile))
  } catch (err) {
    next(err)
  }
}

export async function updatePhotoCaption(req: Request, res: Response, next: NextFunction) {
  try {
    const { photoId } = req.params
    const { caption } = z.object({ caption: z.string().max(500).trim() }).parse(req.body)

    const profile = await Profile.findOne({ userId: req.user!.id })
    if (!profile) { res.status(404).json({ error: 'Perfil no encontrado' }); return }

    const photo = profile.photos?.find((p) => p._id?.toString() === photoId)
    if (!photo) { res.status(404).json({ error: 'Foto no encontrada' }); return }

    photo.caption = caption
    await profile.save()

    res.json({ id: photo._id?.toString(), caption: photo.caption })
  } catch (err) {
    next(err)
  }
}

export async function updateMediaItemHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { mediaId } = req.params
    const patch = z.object({
      title: z.string().optional(),
      description: z.string().max(1000).optional(),
      genres: z.array(z.string()).max(3).optional(),
    }).parse(req.body)

    const result = await updateMediaItem(req.user!.id, mediaId, patch)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function topByFollowers(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 10
    const profiles = await getTopProfilesByFollowers(limit)
    res.json(profiles.map(serializeProfile))
  } catch (err) {
    next(err)
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const genres = req.query.genres
      ? (req.query.genres as string).split(',').filter(Boolean)
      : undefined
    const eventTypes = req.query.eventTypes
      ? (req.query.eventTypes as string).split(',').filter(Boolean)
      : undefined

    const profiles = await listProfiles({
      type: req.query.type as string | undefined,
      location: req.query.location as string | undefined,
      genres,
      eventTypes,
      availability: req.query.availability as string | undefined,
      q: req.query.q as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
    })
    res.json(profiles.map(serializeProfile))
  } catch (err) {
    next(err)
  }
}
