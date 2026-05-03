import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { resolveMediaUrl } from '../controllers/mediaController.js'

const router = Router()

router.post('/resolve', requireAuth, resolveMediaUrl)

export default router
