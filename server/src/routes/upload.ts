import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { authUploadLimiter } from '../middleware/rateLimit.js'
import { getSignature, deleteAsset } from '../controllers/uploadController.js'

const router = Router()

router.post('/signature', requireAuth, authUploadLimiter, getSignature)
router.delete('/asset', requireAuth, authUploadLimiter, deleteAsset)

export default router
