import { Router } from 'express'
import { getArtistImagePool } from '../services/artistImageService.js'
import { logger } from '../utils/logger.js'

const router = Router()

// GET /api/artist-images — public, cached 12h server-side, client TTL 7d
router.get('/', async (_req, res) => {
  try {
    const images = await getArtistImagePool()
    res.setHeader('Cache-Control', 'public, max-age=43200')
    res.json({ images, ttlSeconds: 604800 })
  } catch (err) {
    logger.error('Error fetching artist image pool', err)
    res.status(503).json({ error: 'image-pool-unavailable' })
  }
})

export default router
