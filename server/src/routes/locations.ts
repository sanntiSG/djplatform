import { Router } from 'express'
import { searchLocations, getProvinces } from '../services/georefService.js'
import { generalLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.get('/search', generalLimiter, async (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim()
    if (!q || q.length < 2) {
      return res.json([])
    }
    const results = await searchLocations(q)
    res.json(results)
  } catch (err) {
    res.status(502).json({ message: 'Error consultando Georef AR' })
  }
})

router.get('/provinces', async (_req, res) => {
  try {
    const results = await getProvinces()
    res.json(results)
  } catch (err) {
    res.status(502).json({ message: 'Error consultando Georef AR' })
  }
})

export default router
