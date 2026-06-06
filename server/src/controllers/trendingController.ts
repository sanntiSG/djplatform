import type { Request, Response } from 'express'
import { getTrendingEvents, getTrendingSongs } from '../services/trendingService.js'

export async function getTrending(_req: Request, res: Response) {
  try {
    const [events, songs] = await Promise.all([
      getTrendingEvents(20),
      getTrendingSongs(20),
    ])
    res.json({ events, songs })
  } catch (err) {
    console.error('[trending] error:', err)
    res.status(500).json({ error: 'Error al obtener trending' })
  }
}
