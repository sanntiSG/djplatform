import type { Request, Response, NextFunction } from 'express'
import { getRecentActivity } from '../services/activityService.js'
import { ExternalFeedItem } from '../models/ExternalFeedItem.js'

export async function listActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 20

    const [internal, external] = await Promise.all([
      getRecentActivity(limit),
      ExternalFeedItem.find().sort({ fetchedAt: -1 }).limit(10).lean(),
    ])

    const externalNormalized = external.map(e => ({
      id: e._id.toString(),
      type: e.type as string,
      source: e.source,
      actorProfileId: null,
      actorName: e.subtitle ?? e.source,
      actorAvatar: e.imageUrl,
      actorSlug: null,
      targetTitle: e.title,
      targetUrl: e.url,
      createdAt: e.fetchedAt.toISOString(),
      isExternal: true,
    }))

    // Merge and sort by date, internal first for same timestamp
    const all = [
      ...internal.map(i => ({ ...i, isExternal: false })),
      ...externalNormalized,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json(all.slice(0, limit))
  } catch (err) {
    next(err)
  }
}
