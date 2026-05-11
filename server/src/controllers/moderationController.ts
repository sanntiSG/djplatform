import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { moderateImage, moderateTrack } from '../services/moderationService.js'

const CheckSchema = z.object({
  url: z.string().url(),
  kind: z.enum(['image', 'media']),
  // For media tracks, pass additional context
  platform: z.enum(['youtube', 'spotify', 'soundcloud']).optional(),
  title: z.string().max(300).optional(),
  embedId: z.string().optional(),
})

export async function checkContent(req: Request, res: Response, next: NextFunction) {
  try {
    const { url, kind, platform, title, embedId } = CheckSchema.parse(req.body)

    let result
    if (kind === 'image') {
      result = await moderateImage(url)
    } else {
      result = await moderateTrack(platform ?? 'youtube', url, title ?? '', embedId)
    }

    if (!result.approved) {
      res.status(422).json({
        approved: false,
        reasons: result.reasons,
        error: 'Contenido inapropiado detectado.',
      })
      return
    }

    res.json({ approved: true, cached: result.cached })
  } catch (err) {
    next(err)
  }
}
