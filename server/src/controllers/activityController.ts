import type { Request, Response, NextFunction } from 'express'
import { getRecentActivity } from '../services/activityService.js'
import { ExternalFeedItem } from '../models/ExternalFeedItem.js'

const REGION_ORDER: Record<string, number> = { ar: 0, latam: 1, world: 2 }

export async function listActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 20

    const [internal, external] = await Promise.all([
      getRecentActivity(limit),
      ExternalFeedItem.find().sort({ fetchedAt: -1 }).limit(50).lean(),
    ])

    // Sort external: AR first, then LATAM, then World; within same region by fetchedAt desc
    const sortedExternal = [...external].sort((a, b) => {
      const rA = REGION_ORDER[a.region ?? 'world'] ?? 2
      const rB = REGION_ORDER[b.region ?? 'world'] ?? 2
      if (rA !== rB) return rA - rB
      return b.fetchedAt.getTime() - a.fetchedAt.getTime()
    })

    const externalNormalized = sortedExternal.map(e => ({
      id: e._id.toString(),
      type: e.type as string,
      source: e.source,
      region: e.region ?? 'world',
      actorProfileId: null,
      actorName: e.subtitle ?? e.source,
      actorAvatar: e.imageUrl,
      actorSlug: null,
      targetTitle: e.title,
      targetUrl: e.url,
      createdAt: e.fetchedAt.toISOString(),
      isExternal: true,
    }))

    // Internal activity first (recent platform events), then external sorted by region
    const all = [
      ...internal.map(i => ({ ...i, isExternal: false })),
      ...externalNormalized,
    ].slice(0, limit)

    res.json(all)
  } catch (err) {
    next(err)
  }
}
