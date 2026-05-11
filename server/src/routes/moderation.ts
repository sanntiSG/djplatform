import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { authUploadLimiter } from '../middleware/rateLimit.js'
import { checkContent } from '../controllers/moderationController.js'

const router = Router()

router.post('/check', requireAuth, authUploadLimiter, checkContent)

export default router
