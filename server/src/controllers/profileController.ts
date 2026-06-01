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
import { getSuggestionsFor } from '../services/matchingService.js'
import { cache } from '../services/cache.js'

const PROFILE_LIST_TTL = 30_000   // 30s — listados cambian con nuevos perfiles
const PROFILE_TOP_TTL  = 60_000   // 60s — ranking de top cambia menos seguido
const PROFILE_GET_TTL  = 60_000   // 60s — perfil publico individual

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
    }).catch(() => { })

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

    // Capture previous state only when media/photos are being updated
    const needsCheck = Boolean(data.media || data.photos)
    let prevMediaUrls = new Set<string>()
    let prevPhotos = 0
    if (needsCheck) {
      const prev = await Profile.findOne({ userId: req.user!.id }).select('media photos').lean()
      const prevMediaItems = (prev?.media ?? []) as { url: string }[]
      prevMediaUrls = new Set(prevMediaItems.map(m => m.url))
      prevPhotos = (prev?.photos as unknown[])?.length ?? 0
    }

    const profile = await updateProfile(req.user!.id, data)
    if (!profile) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }

    // Invalidar cache del perfil publico y del listado (contiene datos del perfil)
    cache.del(`profile:${profile._id.toString()}`)
    cache.del('profile:top:10')

    const serialized = serializeProfile(profile)

    if (needsCheck) {
      const pid = serialized.id
      const name = serialized.artistName
      const avatar = serialized.avatar
      const url = `/p/${serialized.slug}-${serialized.id}`

      if (data.media) {
        // Detect truly new tracks by comparing URLs, not array length
        const newTracks = profile.media.filter(m => !prevMediaUrls.has(m.url))
        for (const track of newTracks) {
          createActivity({
            type: 'media_added',
            actorProfileId: pid,
            actorName: name,
            actorAvatar: avatar,
            targetTitle: track.title ?? undefined,
            targetUrl: url,
            targetImage: track.thumbnailUrl,
          }).catch(() => { })
        }
      }
      if (data.photos && (profile.photos?.length ?? 0) > prevPhotos) {
        const newestPhoto = profile.photos[profile.photos.length - 1]
        createActivity({
          type: 'photo_added',
          actorProfileId: pid,
          actorName: name,
          actorAvatar: avatar,
          targetUrl: url,
          targetImage: newestPhoto.url,
        }).catch(() => { })
      }
    }

    res.json(serialized)
  } catch (err) {
    next(err)
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseObjectId(req.params.id)
    const isAdmin = req.user?.role === 'admin'

    // Cache solo para visitantes publicos o usuarios sin rol admin
    const cacheKey = `profile:${id}`
    if (!isAdmin) {
      const cached = cache.get(cacheKey)
      if (cached) {
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
        res.json(cached)
        return
      }
    }

    const profile = await getProfileById(id)
    if (!profile || (!profile.isVisible && !isAdmin)) {
      res.status(404).json({ error: 'Perfil no encontrado' })
      return
    }

    const serialized = serializeProfile(profile)
    if (!isAdmin) {
      cache.set(cacheKey, serialized, PROFILE_GET_TTL)
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    }
    res.json(serialized)
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
    const cacheKey = `profile:top:${limit}`
    const cached = cache.get(cacheKey)
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
      res.json(cached)
      return
    }
    const profiles = await getTopProfilesByFollowers(limit)
    const serialized = profiles.map(serializeProfile)
    cache.set(cacheKey, serialized, PROFILE_TOP_TTL)
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    res.json(serialized)
  } catch (err) {
    next(err)
  }
}

export async function getSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await getProfileByUserId(req.user!.id)
    if (!profile) {
      res.json([])
      return
    }
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 8
    const suggestions = await getSuggestionsFor(profile._id.toString(), req.user!.id, limit)
    res.json(suggestions)
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

    const filters = {
      type: req.query.type as string | undefined,
      location: req.query.location as string | undefined,
      genres,
      eventTypes,
      availability: req.query.availability as string | undefined,
      q: req.query.q as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
    }

    // Cache por combinacion de filtros — key estable basada en query string canonico
    const cacheKey = `profile:list:${JSON.stringify(filters)}`
    const cached = cache.get(cacheKey)
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
      res.json(cached)
      return
    }

    const profiles = await listProfiles(filters)
    const serialized = profiles.map(serializeProfile)
    cache.set(cacheKey, serialized, PROFILE_LIST_TTL)
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    res.json(serialized)
  } catch (err) {
    next(err)
  }
}
