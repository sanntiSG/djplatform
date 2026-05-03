import type { Request, Response, NextFunction } from 'express'
import { MediaResolveInputSchema } from '@dj/shared'
import { resolveMedia } from '../services/mediaResolver.js'

export async function resolveMediaUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = MediaResolveInputSchema.parse(req.body)
    const result = await resolveMedia(url)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
