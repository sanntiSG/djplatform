import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getTypes, getPreferences, updatePreferences } from '../controllers/notificationController.js'

const router = Router()

router.get('/types', requireAuth, getTypes)
router.get('/preferences', requireAuth, getPreferences)
router.patch('/preferences', requireAuth, updatePreferences)

export default router
