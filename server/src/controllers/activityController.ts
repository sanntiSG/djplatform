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

    // Sort external: AR first, then LATAM, then World
    const grouped: Record<string, any[]> = { ar: [], latam: [], world: [] }
    for (const e of external) {
      const reg = e.region || 'world'
      if (grouped[reg]) grouped[reg].push(e)
      else grouped.world.push(e)
    }

    // Shuffle within regions to provide variety
    const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5)
    const sortedExternal = [
      ...shuffle(grouped.ar),
      ...shuffle(grouped.latam),
      ...shuffle(grouped.world),
    ]

    const externalNormalized = sortedExternal.map(e => ({
      id: e._id.toString(),
      type: e.type as string,
      source: e.source,
      region: e.region ?? 'world',
      actorProfileId: null,
      actorName: e.subtitle ?? e.source,
      actorAvatar: e.logoUrl || e.imageUrl,
      actorSlug: null,
      targetTitle: e.title,
      targetUrl: e.url,
      targetImage: e.imageUrl,
      createdAt: e.fetchedAt.toISOString(),
      isExternal: true,
    }))

    // Interleave: [Internal, External, Internal, External...]
    const all: any[] = []
    const max = Math.max(internal.length, externalNormalized.length)
    for (let i = 0; i < max; i++) {
      if (internal[i]) all.push({ ...internal[i], isExternal: false })
      if (externalNormalized[i]) all.push(externalNormalized[i])
      if (all.length >= limit) break
    }

    res.json(all)
  } catch (err) {
    next(err)
  }
}
