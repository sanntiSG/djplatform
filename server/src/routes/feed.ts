import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { recommendSongs, recommendArtists } from '../controllers/recommendationsController.js'

const router = Router()

router.get('/recommendations/songs', requireAuth, recommendSongs)
router.get('/recommendations/artists', requireAuth, recommendArtists)

export default router
