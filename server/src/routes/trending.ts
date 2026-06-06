import { Router } from 'express'
import { getTrending } from '../controllers/trendingController.js'

const router = Router()

// GET /trending — public endpoint, no auth required
router.get('/', getTrending)

export default router
