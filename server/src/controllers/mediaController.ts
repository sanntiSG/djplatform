import type { Request, Response, NextFunction } from 'express'
import { MediaResolveInputSchema } from '@dj/shared'
import { resolveMedia } from '../services/mediaResolver.js'
import { tracksByGenre } from '../services/mediaService.js'

export async function resolveMediaUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = MediaResolveInputSchema.parse(req.body)
    const result = await resolveMedia(url)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getTracksByGenre(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50
    const tracks = await tracksByGenre(slug, limit)
    res.json(tracks)
  } catch (err) {
    next(err)
  }
}
