import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getSignature } from '../controllers/uploadController.js'

const router = Router()

router.post('/signature', requireAuth, getSignature)

export default router
