import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { SavedMedia } from '../models/SavedMedia.js'

export async function toggleSave(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id)
    const profileId = new mongoose.Types.ObjectId(req.params.profileId)
    const mediaId = new mongoose.Types.ObjectId(req.params.mediaId)

    const existing = await SavedMedia.findOne({ userId, mediaId })
    if (existing) {
      await existing.deleteOne()
      res.json({ saved: false })
      return
    }

    await SavedMedia.create({ userId, profileId, mediaId })
    res.json({ saved: true })
  } catch {
    res.status(500).json({ error: 'Error al guardar' })
  }
}

export async function listSaved(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id)
    const { genre, artist } = req.query as { genre?: string; artist?: string }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: { userId } },
      { $sort: { savedAt: -1 } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'profileId',
          foreignField: '_id',
          as: 'profile',
        },
      },
      { $unwind: '$profile' },
      {
        $addFields: {
          mediaItem: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$profile.media',
                  cond: { $eq: ['$$this._id', '$mediaId'] },
                },
              },
              0,
            ],
          },
        },
      },
      { $match: { mediaItem: { $ne: null } } },
    ]

    if (genre) {
      pipeline.push({ $match: { 'mediaItem.genres': genre } })
    }

    if (artist) {
      pipeline.push({
        $match: {
          'profile.artistName': { $regex: artist, $options: 'i' },
        },
      })
    }

    pipeline.push({
      $project: {
        _id: 1,
        mediaId: 1,
        profileId: 1,
        savedAt: 1,
        artistName: '$profile.artistName',
        avatar: '$profile.avatar',
        title: '$mediaItem.title',
        platform: '$mediaItem.platform',
        thumbnailUrl: '$mediaItem.thumbnailUrl',
        type: '$mediaItem.type',
        genres: '$mediaItem.genres',
      },
    })

    const results = await SavedMedia.aggregate(pipeline)
    res.json(results)
  } catch {
    res.status(500).json({ error: 'Error al obtener guardados' })
  }
}

export async function removeSaved(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id)
    const mediaId = new mongoose.Types.ObjectId(req.params.mediaId)
    await SavedMedia.deleteOne({ userId, mediaId })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Error al eliminar' })
  }
}
