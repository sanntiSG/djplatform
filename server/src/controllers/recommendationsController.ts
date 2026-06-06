import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { SavedMedia } from '../models/SavedMedia.js'
import { ContentLike } from '../models/ContentLike.js'
import { ProfileLike } from '../models/ProfileLike.js'
import { Profile } from '../models/Profile.js'

async function getUserGenres(userId: mongoose.Types.ObjectId): Promise<{
  genres: string[]
  likedMediaIds: mongoose.Types.ObjectId[]
  likedProfileIds: mongoose.Types.ObjectId[]
}> {
  // Limite para que usuarios con cientos de interacciones no generen payloads gigantes
  const [savedMedia, likedProfiles, likedMedia] = await Promise.all([
    SavedMedia.find({ userId }).limit(500).lean(),
    ProfileLike.find({ userId }).limit(500).lean(),
    // Canciones que el usuario dio me gusta — criterio de exclusion en recomendaciones
    ContentLike.find({ userId, targetKind: 'media' }).limit(500).lean(),
  ])

  const likedMediaIds = likedMedia.map((l) => l.targetId)
  const likedProfileIds = likedProfiles.map((l) => l.profileId)
  const savedProfileIds = [...new Set(savedMedia.map((s) => s.profileId.toString()))]

  // Derivan generos de: perfiles likeados + perfiles cuyos tracks guardo
  const allProfileIds = [
    ...new Set([...likedProfileIds.map((id) => id.toString()), ...savedProfileIds]),
  ]

  const profiles = await Profile.find(
    { _id: { $in: allProfileIds } },
    { genres: 1, 'media.genres': 1 },
  ).lean()

  const genreSet = new Set<string>()
  profiles.forEach((p) => {
    p.genres?.forEach((g) => { if (g) genreSet.add(g) })
    p.media?.forEach((m) => m.genres?.forEach((g) => { if (g) genreSet.add(g) }))
  })

  // Tambien derivan generos de las medias especificas guardadas
  const savedMediaIds = savedMedia.map((s) => s.mediaId)
  const mediaProfileIds = savedMedia.map((s) => s.profileId)
  const savedOnProfile = await Profile.find(
    { _id: { $in: mediaProfileIds } },
    { 'media._id': 1, 'media.genres': 1 },
  ).lean()

  savedOnProfile.forEach((p) => {
    p.media?.forEach((m) => {
      const mediaWithId = m as typeof m & { _id?: mongoose.Types.ObjectId }
      const isSaved = savedMediaIds.some((id) => id.toString() === mediaWithId._id?.toString())
      if (isSaved) m.genres?.forEach((g) => { if (g) genreSet.add(g) })
    })
  })

  return {
    genres: Array.from(genreSet),
    likedMediaIds,
    likedProfileIds,
  }
}

export async function recommendSongs(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id)
    const limit = Math.min(20, parseInt(String(req.query.limit ?? '5'), 10) || 5)

    const [{ genres, likedMediaIds }, ownProfile] = await Promise.all([
      getUserGenres(userId),
      Profile.findOne({ userId: req.user!.id }, { _id: 1 }).lean(),
    ])

    // Base match: always exclude the authenticated user's own profile
    const baseMatch: Record<string, unknown> = {
      isVisible: true,
      'media.0': { $exists: true },
    }
    if (ownProfile) {
      baseMatch._id = { $ne: ownProfile._id }
    }

    // Exclusion filter applied in both branches: no mostrar canciones que el usuario ya likeo
    const likedExclusionMatch = {
      'media._id': { $nin: likedMediaIds },
    }

    const finalProject = {
      $project: {
        _id: 0,
        profileId: '$_id',
        mediaId: '$media._id',
        artistName: 1,
        avatar: 1,
        title: '$media.title',
        platform: '$media.platform',
        thumbnailUrl: '$media.thumbnailUrl',
        embedId: '$media.embedId',
        type: '$media.type',
        genres: '$media.genres',
      },
    }

    const pipeline: mongoose.PipelineStage[] = []

    if (genres.length > 0) {
      pipeline.push(
        { $match: baseMatch },
        { $project: { artistName: 1, avatar: 1, media: 1 } },
        { $unwind: '$media' },
        {
          $match: {
            'media.genres': { $in: genres },
            ...likedExclusionMatch,
          },
        },
        { $sample: { size: limit } },
        finalProject,
      )
    } else {
      pipeline.push(
        { $match: baseMatch },
        { $project: { artistName: 1, avatar: 1, media: 1 } },
        { $unwind: '$media' },
        { $match: likedExclusionMatch },
        { $sample: { size: limit } },
        finalProject,
      )
    }

    const results = await Profile.aggregate(pipeline)
    res.json(results)
  } catch {
    res.status(500).json({ error: 'Error al obtener recomendaciones' })
  }
}

export async function recommendArtists(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id)
    const limit = Math.min(20, parseInt(String(req.query.limit ?? '5'), 10) || 5)

    const [{ genres, likedProfileIds }, ownProfile] = await Promise.all([
      getUserGenres(userId),
      Profile.findOne({ userId: req.user!.id }, { _id: 1 }).lean(),
    ])

    // Exclude: profiles already liked + the authenticated user's own profile
    const excludeIds: mongoose.Types.ObjectId[] = ownProfile
      ? [ownProfile._id as mongoose.Types.ObjectId, ...likedProfileIds]
      : likedProfileIds

    let query: Record<string, unknown> = {
      isVisible: true,
      _id: { $nin: excludeIds },
    }

    if (genres.length > 0) {
      query = { ...query, genres: { $in: genres } }
    }

    const profiles = await Profile.aggregate([
      { $match: query },
      { $sample: { size: limit } },
      {
        $project: {
          _id: 0,
          profileId: '$_id',
          artistName: 1,
          avatar: 1,
          genres: 1,
          type: 1,
          location: 1,
        },
      },
    ])

    res.json(profiles)
  } catch {
    res.status(500).json({ error: 'Error al obtener recomendaciones de artistas' })
  }
}
