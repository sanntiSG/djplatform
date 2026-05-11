import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { resolveMediaUrl, getTracksByGenre } from '../controllers/mediaController.js'

const router = Router()

router.post('/resolve', requireAuth, resolveMediaUrl)
router.get('/by-genre/:slug', getTracksByGenre)

export default router
